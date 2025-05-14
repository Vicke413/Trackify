import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
  targetPrice: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace(/[^0-9.]/g, ""));
      return !isNaN(num) && num > 0;
    },
    { message: "Please enter a valid price" }
  ),
});

interface PriceAlertFormProps {
  productId: number;
  currentPrice: number;
  currency: string;
  onSuccess?: () => void;
}

export function PriceAlertForm({ 
  productId, 
  currentPrice, 
  currency, 
  onSuccess 
}: PriceAlertFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetPrice: formatCurrency(currentPrice * 0.9, currency),
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (targetPrice: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/products/${productId}/alerts`, 
        { targetPrice, active: true }
      );
      return response.json();
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/alerts`] });
      form.reset();
      toast({
        title: "Price alert set",
        description: "You'll be notified when the price drops to your target",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to set price alert",
        description: error instanceof Error ? error.message : "Could not create the alert. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert formatted price string to number
    const targetPrice = parseFloat(values.targetPrice.replace(/[^0-9.]/g, ""));
    createAlertMutation.mutate(targetPrice);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="targetPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Price</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  disabled={isSubmitting}
                  placeholder={formatCurrency(currentPrice * 0.9, currency)}
                />
              </FormControl>
              <FormDescription>
                You'll be notified when the price drops to this amount or lower
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting alert...
            </>
          ) : (
            "Set Price Alert"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default PriceAlertForm;
