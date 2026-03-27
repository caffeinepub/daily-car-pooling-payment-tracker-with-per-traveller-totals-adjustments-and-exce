import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useReadOnly } from "../../context/ReadOnlyContext";
import { formatCurrency } from "../../utils/money";
import { useLedgerState } from "./LedgerStateContext";

export default function RatePerTripControl() {
  const { ratePerTrip, setRatePerTrip } = useLedgerState();
  const { isReadOnly } = useReadOnly();
  const [inputValue, setInputValue] = useState(ratePerTrip.toString());

  useEffect(() => {
    setInputValue(ratePerTrip.toString());
  }, [ratePerTrip]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Parse and validate
    const numValue = Number.parseFloat(value);
    if (!Number.isNaN(numValue) && numValue >= 0) {
      setRatePerTrip(Math.max(0, numValue));
    }
  };

  const handleBlur = () => {
    // Ensure valid value on blur
    const numValue = Number.parseFloat(inputValue);
    if (Number.isNaN(numValue) || numValue < 0) {
      setInputValue(ratePerTrip.toString());
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <Label
        htmlFor="rate-per-trip"
        className="text-sm font-medium whitespace-nowrap flex items-center gap-1"
      >
        Rate per trip:
        {isReadOnly && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
      </Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">₹</span>
        <Input
          id="rate-per-trip"
          type="number"
          min="0"
          step="10"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-24 h-9"
          disabled={isReadOnly}
        />
        <span className="text-sm text-muted-foreground">
          ({formatCurrency(ratePerTrip)})
        </span>
      </div>
    </div>
  );
}
