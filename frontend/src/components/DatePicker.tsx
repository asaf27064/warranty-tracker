import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import "react-day-picker/style.css";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type Props = {
  id?: string;
  value: string; // "yyyy-MM-dd" or ""
  onChange: (value: string) => void;
  invalid?: boolean;
};

const DatePicker = ({ id, value, onChange, invalid }: Props) => {
  const [open, setOpen] = useState(false);
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        className={`flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 text-left text-sm transition-colors hover:bg-muted/50 ${
          invalid ? "border-red-500 ring-1 ring-red-500" : "border-input"
        }`}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {selected ? (
          <span>{format(selected, "dd/MM/yyyy")}</span>
        ) : (
          <span className="text-muted-foreground">Pick a date</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
