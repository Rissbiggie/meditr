import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { UserRole, InsertUser } from "@shared/schema";

interface RegisterFormProps {
  onSubmit: (data: InsertUser) => void;
  isPending: boolean;
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .min(12, "Phone number must be at least 12 digits")
    .max(13, "Phone number must be at most 13 digits")
    .regex(/^\+254[17]\d{8}$/, "Invalid Kenyan phone number format. Use +254 followed by 7 or 1 and 8 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and privacy policy",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function RegisterForm({ onSubmit, isPending }: RegisterFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const userData: InsertUser = {
      firstName: values.firstName,
      lastName: values.lastName,
      username: values.username,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: UserRole.USER
    };
    
    onSubmit(userData);
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <Form {...form}>
        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-white/80 text-sm mb-1">First Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field} 
                      placeholder="John"
                      className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-white/80 text-sm mb-1">Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Doe"
                      className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-white/80 text-sm mb-1">Username</FormLabel>
                <FormControl>
                  <Input
                    {...field} 
                    placeholder="johndoe"
                    className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-white/80 text-sm mb-1">Email</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="email"
                    placeholder="your@email.com"
                    className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-white/80 text-sm mb-1">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    {...field} 
                    type="tel" 
                    placeholder="+254712345678"
                    className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-white/80 text-sm mb-1">Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-white/80 text-sm mb-1">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    {...field} 
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white/20 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                      className="rounded text-secondary mr-2" 
                    />
                  </FormControl>
                  <FormLabel className="text-white/80 text-sm">
                    I agree to the <a href="#" className="text-secondary mx-1">Terms</a> and <a href="#" className="text-secondary ml-1">Privacy Policy</a>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
