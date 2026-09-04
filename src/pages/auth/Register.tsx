import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../../lib/formErrors";
import { register as registerApi } from "../../api/auth.api";
import TextField from "../../components/common/TextField";
import PasswordField from "../../components/common/PasswordField";
import SubmitButton from "../../components/common/SubmitButton";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Mật khẩu xác nhận không khớp" }));
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    
    if (password.length < 8) {
      setErrors((prev) => ({ ...prev, password: "Mật khẩu phải có ít nhất 8 ký tự" }));
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setLoading(true);
    try {
      const response = await registerApi({ name, email, password });
      if (response.data.success) {
        toast.success("Account created! Please verify your email.");
        navigate("/verify-email", { state: { email } });
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Registration failed"));
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
        <h2 className="text-4xl font-bold text-slate-900 mb-2">Create Account</h2>
        <p className="text-slate-500">Join thousands of learners mastering English every day.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          id="register-name"
          label="Full Name"
          value={name}
          onChange={(value) => {
            setName(value);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }));
            }
          }}
          placeholder="e.g. Jane Doe"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.name}
          required
        />

        <TextField
          id="register-email"
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
        />

        <PasswordField
          id="register-password"
          label="Password"
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
        />

        <PasswordField
          id="register-confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            if (errors.confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }
          }}
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword}
          required
        />

        <p className="text-xs text-slate-500">Min 8 characters</p>

        <SubmitButton
          label={loading ? "Registering" : "Register"}
          loading={loading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        />
      </form>

      <div className="text-center">
        <p className="text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
