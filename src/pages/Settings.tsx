import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Camera,
  Save,
  Mail,
  Lock
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../lib/formErrors";
import { getProfile, updateProfile, requestEmailChange, confirmEmailChange } from "../api/user.api";
import TextField from "../components/form/TextField";

const SettingSection = ({ title, icon: Icon, children }: any) => (
  <section className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    </div>
    {children}
  </section>
);

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
  });
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [emailChange, setEmailChange] = useState({ newEmail: "", otp: "" });
  const [emailChangeErrors, setEmailChangeErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState({ profile: false, requestEmail: false, confirmEmail: false });
  const [hasEditedProfile, setHasEditedProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          updateUser({
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            isVerified: profile.isVerified,
          });
          if (!hasEditedProfile) {
            setFormData({
              name: profile.name || "",
              avatar: profile.avatar || "",
            });
          }
        }
      } catch (error: any) {
        toast.error(getErrorMessage(error, "Failed to load profile"));
      }
    };

    loadProfile();
  }, [hasEditedProfile, updateUser]);

  const handleSave = async () => {
    setLoading((prev) => ({ ...prev, profile: true }));
    setProfileErrors({});
    try {
      const response = await updateProfile({
        name: formData.name,
        avatar: formData.avatar || undefined,
      });
      if (response.data.success) {
        updateUser({ name: formData.name, avatar: formData.avatar || null });
        toast.success("Profile updated successfully!");
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setProfileErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Failed to save profile"));
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const handleRequestEmailChange = async () => {
    setLoading((prev) => ({ ...prev, requestEmail: true }));
    setEmailChangeErrors({});
    try {
      const response = await requestEmailChange({ newEmail: emailChange.newEmail });
      if (response.data.success) {
        toast.success("OTP sent to your new email.");
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setEmailChangeErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setLoading((prev) => ({ ...prev, requestEmail: false }));
    }
  };

  const handleConfirmEmailChange = async () => {
    setLoading((prev) => ({ ...prev, confirmEmail: true }));
    setEmailChangeErrors({});
    try {
      const response = await confirmEmailChange({
        newEmail: emailChange.newEmail,
        otp: emailChange.otp,
      });
      if (response.data.success) {
        updateUser({ email: emailChange.newEmail });
        setEmailChange({ newEmail: "", otp: "" });
        toast.success("Email updated successfully!");
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setEmailChangeErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Failed to confirm email change"));
    } finally {
      setLoading((prev) => ({ ...prev, confirmEmail: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <div className="relative mb-20 min-h-[240px]">
        <div className="h-[160px] w-full rounded-[32px] bg-gradient-to-r from-purple-100 to-pink-100 relative overflow-hidden" />

        <div className="absolute left-8 -bottom-8 flex items-end gap-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              <img src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-1 right-1 p-2 bg-purple-600 text-white rounded-full shadow-lg">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <SettingSection title="Personal Information" icon={User}>
          <p className="text-sm text-slate-500">Editable fields: full name and avatar URL.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <TextField
                id="profile-name"
                label="Full Name"
                value={formData.name}
                onChange={(value) => {
                  setFormData({ ...formData, name: value });
                  setHasEditedProfile(true);
                  if (profileErrors.name) {
                    setProfileErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                error={profileErrors.name}
              />
            </div>

            <div className="space-y-2">
              <TextField
                id="profile-email"
                label="Email Address"
                type="email"
                value={user?.email || ""}
                onChange={() => undefined}
                disabled
                inputClassName="bg-slate-100 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <TextField
                id="profile-avatar"
                label="Avatar URL"
                type="url"
                value={formData.avatar}
                onChange={(value) => {
                  setFormData({ ...formData, avatar: value });
                  setHasEditedProfile(true);
                  if (profileErrors.avatar) {
                    setProfileErrors((prev) => ({ ...prev, avatar: "" }));
                  }
                }}
                placeholder="https://..."
                error={profileErrors.avatar}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={loading.profile}
              className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-5 h-5" />
              {loading.profile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </SettingSection>

        <SettingSection title="Account Security" icon={ShieldCheck}>
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Change Email</p>
                  <p className="text-xs text-slate-400">Request OTP then confirm with the code sent to your new email.</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <TextField
                    id="email-change-new"
                    label="New Email"
                    type="email"
                    value={emailChange.newEmail}
                    onChange={(value) => {
                      setEmailChange({ ...emailChange, newEmail: value });
                      if (emailChangeErrors.newEmail) {
                        setEmailChangeErrors((prev) => ({ ...prev, newEmail: "" }));
                      }
                    }}
                    placeholder="new-email@example.com"
                    error={emailChangeErrors.newEmail}
                    inputClassName="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <TextField
                    id="email-change-otp"
                    label="OTP Code"
                    value={emailChange.otp}
                    onChange={(value) => {
                      setEmailChange({ ...emailChange, otp: value });
                      if (emailChangeErrors.otp) {
                        setEmailChangeErrors((prev) => ({ ...prev, otp: "" }));
                      }
                    }}
                    placeholder="6-digit code"
                    error={emailChangeErrors.otp}
                    inputClassName="bg-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleRequestEmailChange}
                  disabled={loading.requestEmail}
                  className="px-6 py-3 border border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors disabled:opacity-60"
                >
                  {loading.requestEmail ? "Sending..." : "Send OTP"}
                </button>
                <button
                  onClick={handleConfirmEmailChange}
                  disabled={loading.confirmEmail}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all disabled:opacity-60"
                >
                  {loading.confirmEmail ? "Confirming..." : "Confirm Email"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Password</p>
                <p className="text-xs text-slate-400">Use the "Forgot password" flow to reset your password.</p>
              </div>
            </div>
          </div>
        </SettingSection>
      </div>
    </div>
  );
}
