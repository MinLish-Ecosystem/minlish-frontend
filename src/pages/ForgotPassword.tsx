import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../lib/formErrors";
import { forgotPassword as forgotPasswordApi } from "../api/auth.api";
import TextField from "../components/form/TextField";
import SubmitButton from "../components/form/SubmitButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await forgotPasswordApi({ email });
      if (response.data.success) {
        toast.success("OTP sent to your email!");
        navigate("/reset-password", { state: { email } });
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 md:p-12 rounded-[24px] shadow-2xl border border-slate-100 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-8 text-orange-600">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        Enter your email address and we'll send you an OTP to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <TextField
          id="forgot-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: "" }));
            }
          }}
          placeholder="you@example.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email}
          required
          inputClassName="focus:ring-orange-100 focus:border-orange-400"
        />

        <SubmitButton
          label={loading ? "Sending" : "Send OTP"}
          loading={loading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-full shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        />
      </form>

      <div className="mt-10">
        <Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
}
