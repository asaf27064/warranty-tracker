import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowUpDown } from "lucide-react";

const sortLabels: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  expiring: "Expiring soon",
  name: "Name A-Z",
};

type Props = {
  sortBy: string;
  setSortBy: (value: string) => void;
};

const ProductFilters = ({ sortBy, setSortBy }: Props) => {
  return (
    <Select value={sortBy} onValueChange={(value) => setSortBy(value ?? "newest")}>
      <SelectTrigger className="w-44 text-sm">
        <span className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <SelectValue>{sortLabels[sortBy]}</SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(sortLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProductFilters;
