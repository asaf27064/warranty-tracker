import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";

const { apiGet, apiPatch, apiDelete, authPost, navigate, toastError } =
  vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
    apiDelete: vi.fn(),
    authPost: vi.fn(),
    navigate: vi.fn(),
    toastError: vi.fn(),
  }));

vi.mock("../api/axios", () => ({
  default: { get: apiGet, patch: apiPatch, delete: apiDelete },
  authApi: { post: authPost },
  setupInterceptors: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));

vi.mock("react-router-dom", async (orig) => {
  const actual = await orig<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

import { AuthProvider, useAuth } from "./AuthContext";

const Probe = () => {
  const { user, accessToken, loading, lastUser, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="token">{accessToken ?? ""}</span>
      <span data-testid="user">{user?.email ?? ""}</span>
      <span data-testid="last">{lastUser?.email ?? ""}</span>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
};

const renderProvider = (strict = false) => {
  const tree = (
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("loads the session on mount: refreshes, fetches the user, stops loading", async () => {
    authPost.mockResolvedValue({ data: { accessToken: "at1" } });
    apiGet.mockResolvedValue({ data: { user: { email: "a@b.com", name: "Ann" } } });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com"),
    );
    expect(screen.getByTestId("token")).toHaveTextContent("at1");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("stays silent when there is no session (no expired toast on first load)", async () => {
    authPost.mockRejectedValue(new Error("401"));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("coalesces concurrent refreshes into one request under StrictMode", async () => {
    authPost.mockResolvedValue({ data: { accessToken: "at1" } });
    apiGet.mockResolvedValue({ data: { user: { email: "a@b.com", name: "Ann" } } });

    renderProvider(true);

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com"),
    );
    // StrictMode runs the effect twice; the rotating refresh token must be sent
    // only once or the backend treats the replay as reuse and kills the session.
    expect(authPost).toHaveBeenCalledTimes(1);
  });

  it("logout clears the token but keeps the remembered identity", async () => {
    authPost.mockResolvedValue({ data: { accessToken: "at1" } });
    apiGet.mockResolvedValue({ data: { user: { email: "a@b.com", name: "Ann" } } });

    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com"),
    );

    authPost.mockResolvedValueOnce({ data: {} });
    fireEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByTestId("token")).toHaveTextContent(""));
    expect(screen.getByTestId("user")).toHaveTextContent("");
    expect(screen.getByTestId("last")).toHaveTextContent("a@b.com");
    expect(navigate).toHaveBeenCalledWith("/");
  });
});
