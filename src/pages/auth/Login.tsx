import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../../lib/formErrors";
import { login as loginApi } from "../../api/auth.api";
import TextField from "../../components/common/TextField";
import PasswordField from "../../components/common/PasswordField";
import SubmitButton from "../../components/common/SubmitButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await loginApi({ email, password });
      if (response.data.success && response.data.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        login({ user, accessToken, refreshToken });
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-4xl font-bold text-slate-900 mb-2">Welcome back</h2>
        <p className="text-slate-500">Please enter your details to access your dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: "" }));
            }
          }}
          placeholder="name@example.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email}
          required
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <Link to="/forgot-password" title="Forgot password link" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="login-password"
            label=""
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: "" }));
              }
            }}
            placeholder="••••••••"
            leftIcon={<Lock className="w-5 h-5" />}
            error={errors.password}
            required
            inputClassName="mt-2"
          />
        </div>

        <SubmitButton
          label={loading ? "Signing In" : "Sign In"}
          loading={loading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        />
      </form>

      <div className="text-center">
        <p className="text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-600 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
