import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../../lib/formErrors";
import { login as loginApi, verifyMfaLoginApi } from "../../api/auth.api";
import TextField from "../../components/common/TextField";
import PasswordField from "../../components/common/PasswordField";
import SubmitButton from "../../components/common/SubmitButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [timer, setTimer] = useState(60);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mfaRequired && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mfaRequired, timer]);

  const handleResendMfa = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const response = await loginApi({ email, password });
      if (response.data.success && response.data.data?.mfaRequired) {
        setTimer(60);
        toast.success("Mã OTP mới đã được gửi về email của bạn!");
      }
    } catch (error: any) {
      toast.error("Không thể gửi lại mã OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setOtp("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      if (mfaRequired) {
        const response = await verifyMfaLoginApi({ email, otp });
        if (response.data.success && response.data.data) {
          const { user, accessToken, refreshToken } = response.data.data;
          if (user && accessToken && refreshToken) {
            login({ user, accessToken, refreshToken });
            toast.success("Welcome back, Admin!");
            navigate("/admin/dashboard");
          }
        }
      } else {
        const response = await loginApi({ email, password });
        if (response.data.success && response.data.data) {
          const { user, accessToken, refreshToken, mfaRequired: nextMfaRequired } = response.data.data;
          if (nextMfaRequired) {
            setMfaRequired(true);
            setTimer(60);
            toast.success("Please check your email for the MFA OTP code");
          } else if (user && accessToken && refreshToken) {
            login({ user, accessToken, refreshToken });
            toast.success("Welcome back!");
            if (user.role === 'admin') {
              navigate("/admin/dashboard");
            } else {
              navigate("/dashboard");
            }
          }
        }
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Xác thực không thành công"));
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
        <h2 className="text-4xl font-bold text-slate-900 mb-2">
          {mfaRequired ? "MFA Verification" : "Welcome back"}
        </h2>
        <p className="text-slate-500">
          {mfaRequired 
            ? "Vui lòng nhập mã xác thực OTP đã được gửi về email của bạn." 
            : "Please enter your details to access your dashboard."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!mfaRequired ? (
          <>
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
          </>
        ) : (
          <div className="space-y-4">
            <TextField
              id="login-otp"
              label="Mã xác thực OTP"
              type="text"
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (errors.otp) {
                  setErrors((prev) => ({ ...prev, otp: "" }));
                }
              }}
              placeholder="Nhập mã OTP (6 chữ số)"
              leftIcon={<Lock className="w-5 h-5" />}
              error={errors.otp}
              required
            />
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span>
                {timer > 0 ? (
                  <>Gửi lại mã sau <span className="text-purple-600 font-bold">{timer}s</span></>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendMfa}
                    className="text-purple-600 hover:text-purple-700 hover:underline transition-all cursor-pointer font-bold bg-transparent border-0 p-0"
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </span>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-slate-500 hover:text-slate-800 hover:underline transition-all cursor-pointer bg-transparent border-0 p-0"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}

        <SubmitButton
          label={loading ? (mfaRequired ? "Verifying OTP" : "Signing In") : (mfaRequired ? "Xác nhận OTP" : "Sign In")}
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
        <p className="text-slate-500">
          Tai khoan test user: user@minlish.com  │ User@123
        </p>
        <p className="text-slate-500">
          Tai khoan test admin: herothaibao99@gmail.com  │ Admin@123
        </p>
      </div>
    </motion.div>
  );
}
