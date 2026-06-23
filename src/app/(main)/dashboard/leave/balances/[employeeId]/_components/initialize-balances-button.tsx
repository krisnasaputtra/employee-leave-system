"use client";

import { useState } from "react";

import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { initializeBalancesAction } from "../../actions";

interface InitializeBalancesButtonProps {
  employeeId: string;
  employeeName: string;
}

export function InitializeBalancesButton({ employeeId, employeeName }: InitializeBalancesButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await initializeBalancesAction(employeeId);
      if (result.success) {
        toast.success(`Initialized ${result.count ?? 0} balance(s) for ${employeeName}.`);
      } else {
        toast.error(result.error ?? "Failed to initialize balances.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
      Initialize Balances
    </Button>
  );
}
