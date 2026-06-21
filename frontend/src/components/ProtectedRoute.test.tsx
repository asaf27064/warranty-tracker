import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth }));

import ProtectedRoute from "./ProtectedRoute";

type AuthState = { accessToken: string | null; loading: boolean };

const renderAt = (state: AuthState) => {
  useAuth.mockReturnValue(state);
  return render(
    <MemoryRouter initialEntries={["/dash"]}>
      <Routes>
        <Route path="/" element={<div>landing</div>} />
        <Route
          path="/dash"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => vi.clearAllMocks());

describe("ProtectedRoute", () => {
  it("renders nothing while the session is still loading", () => {
    renderAt({ accessToken: null, loading: true });
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.queryByText("landing")).not.toBeInTheDocument();
  });

  it("redirects to the landing page when there is no token", () => {
    renderAt({ accessToken: null, loading: false });
    expect(screen.getByText("landing")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders the protected content when authenticated", () => {
    renderAt({ accessToken: "at1", loading: false });
    expect(screen.getByText("secret")).toBeInTheDocument();
  });
});
