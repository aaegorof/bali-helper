import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "./label"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"


const InputLabel = ({children, label, className}: {children: React.ReactNode, label: string, className?: string}) => {
    return <div className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
} 



const DebounceInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { delay?: number }
>(({ onChange, delay = 300, ...props }, ref) => {
  const [value, setValue] = React.useState(props.defaultValue || "");
  const timeoutRef = React.useRef<NodeJS.Timeout>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
    }
  }, [props.value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange?.(event);
    }, delay);
  };

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      ref={ref}
    />
  );
});
DebounceInput.displayName = "DebounceInput";


const NumberInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type" | "onChange"> & {
    onChange?: (value: number | null) => void;
    value?: number | null;
  }
>(({ className, onChange, value, ...props }, ref) => {
  // Форматирование числа для отображения
  const formatNumber = (num: number | null) => {
    if (num === null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Очистка строки от всего, кроме цифр
  const cleanNumber = (str: string) => {
    return str.replace(/[^\d.-]/g, "");
  };

  // Обработка изменения значения
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanNumber(e.target.value);
    
    // Если поле пустое, передаем null
    if (!cleaned) {
      onChange?.(null);
      return;
    }

    const num = parseFloat(cleaned);
    
    // Проверяем, является ли значение числом
    if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={formatNumber(value ?? null)}
      onChange={handleChange}
      ref={ref}
      className={cn("text-right", className)}
    />
  );
});
NumberInput.displayName = "NumberInput";

const DebounceNumberInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof NumberInput>, "onChange"> & {
    onChange?: (value: number | null) => void;
    delay?: number;
  }
>(({ onChange, delay = 300, ...props }, ref) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>(null);
  const [value, setValue] = React.useState<number | null>(props.value ?? null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
    }
  }, [props.value]);

  const handleChange = (newValue: number | null) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange?.(newValue);
    }, delay);
  };

  return (
    <NumberInput
      {...props}
      value={value ?? undefined}
      onChange={handleChange}
      ref={ref}
    />
  );
});
DebounceNumberInput.displayName = "DebounceNumberInput";

export { Input, InputLabel, DebounceInput, NumberInput, DebounceNumberInput }