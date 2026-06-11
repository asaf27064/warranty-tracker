import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { ArrowUpDown } from "lucide-react";

const options = [
  { value: "created:desc", label: "Newest first" },
  { value: "created:asc", label: "Oldest first" },
  { value: "expiry:asc", label: "Expiring soon" },
  { value: "name:asc", label: "Name A–Z" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const ProductFilters = ({ value, onChange }: Props) => {
  const label = options.find((o) => o.value === value)?.label ?? "Sort";
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "created:desc")}>
      <SelectTrigger className="w-44 text-sm">
        <span className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProductFilters;
