import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Key, Lock, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../lib/formErrors";
import { resetPassword as resetPasswordApi } from "../api/auth.api";
import TextField from "../components/form/TextField";
import PasswordField from "../components/form/PasswordField";
import SubmitButton from "../components/form/SubmitButton";

export default function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    setErrors({});
    try {
      const response = await resetPasswordApi({
        email,
        otp,
        newPassword: password,
      });
      if (response.data.success) {
        toast.success("Password reset successfully!");
        navigate("/login");
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Failed to reset password"));
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
      <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-8 text-purple-600">
        <Key className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        Please enter the OTP sent to your email and choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-6 text-left">
        <TextField
          id="reset-otp"
          label="Security Code (OTP)"
          value={otp}
          onChange={(value) => {
            setOtp(value);
            if (errors.otp) {
              setErrors((prev) => ({ ...prev, otp: "" }));
            }
          }}
          placeholder="6-digit code"
          error={errors.otp}
          required
          inputClassName="focus:ring-purple-100 focus:border-purple-400"
        />

        <PasswordField
          id="reset-password"
          label="New Password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (errors.newPassword) {
              setErrors((prev) => ({ ...prev, newPassword: "" }));
            }
          }}
          placeholder="Enter new password"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.newPassword}
          required
        />

        <TextField
          id="reset-confirm-password"
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          placeholder="Confirm password"
          required
        />

        <SubmitButton
          label={loading ? "Resetting" : "Reset Password"}
          loading={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-full shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
