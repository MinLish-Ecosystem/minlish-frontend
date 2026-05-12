import React, { useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MailCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../lib/formErrors";
import { verifyEmail as verifyEmailApi } from "../api/auth.api";
import FormError from "../components/form/FormError";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "learner@example.com";

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) return toast.error("Please enter the full code");

    setLoading(true);
    setErrors({});
    try {
      const response = await verifyEmailApi({ email, otp: otpString });
      if (response.data.success) {
        toast.success("Email verified!");
        navigate("/login");
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Verification failed"));
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
      <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-8">
        <MailCheck className="w-8 h-8 text-purple-600" />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        We've sent a 6-digit code to <span className="font-bold text-slate-900">{email}</span>. 
        Please enter it below to confirm your account.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-10">
        <div className="flex justify-between gap-2 max-w-sm mx-auto">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-16 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all shadow-sm"
              required
            />
          ))}
        </div>
        <FormError message={errors.otp} className="text-sm text-red-600 text-center" />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-full shadow-xl shadow-purple-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Verifying..." : "Verify Email"}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      <div className="mt-10 space-y-4">
        <p className="text-slate-500 text-sm">
          Didn't receive the code?{" "}
          <button className="text-purple-600 font-bold hover:underline cursor-pointer">
            Resend Code
          </button>
        </p>
        <Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
}
