import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";
import { extractFieldErrors, getErrorMessage, FieldErrors } from "../../lib/formErrors";
import { getProfile, updateProfile, requestEmailChange, confirmEmailChange, getLearningProfile, updateLearningProfile, LearningProfile } from "../../api/user.api";
import { ConfirmLogoutModal } from "../../components/common";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const pendingUpdatesRef = useRef<Partial<LearningProfile>>({});
  const debounceTimerRef = useRef<any>(null);

  const debouncedUpdate = (update: Partial<LearningProfile>) => {
    // Merge updates into the pending changes object
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...update,
      // Handle preferences sub-object merging properly
      preferences: update.preferences 
        ? { ...pendingUpdatesRef.current.preferences, ...update.preferences }
        : pendingUpdatesRef.current.preferences
    };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const payload = pendingUpdatesRef.current;
      pendingUpdatesRef.current = {}; // Reset
      try {
        await updateLearningProfile(payload);
      } catch (error) {
        console.error("Failed to sync learning profile:", error);
      }
    }, 500); // 500ms delay
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
  });
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [emailChange, setEmailChange] = useState({ newEmail: user?.email || "", otp: "" });
  const [emailChangeErrors, setEmailChangeErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState({ profile: false, requestEmail: false, confirmEmail: false });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [hasEditedProfile, setHasEditedProfile] = useState(false);
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [avatarSource, setAvatarSource] = useState<"upload" | "url">("upload");
  const emailInitializedRef = useRef(false);

  useEffect(() => {
    if (user?.email && !emailInitializedRef.current) {
      setEmailChange((prev) => ({ ...prev, newEmail: user.email }));
      emailInitializedRef.current = true;
    }
  }, [user?.email]);

  // Load persistent learning goals
  const [learningGoals, setLearningGoals] = useState({
    primaryFocus: "general",
    dailyWordTarget: 20,
    dailyReviewTarget: 40,
  });

  // Load app settings
  const [appSettings, setAppSettings] = useState({
    emailNotifications: true,
    darkMode: document.documentElement.classList.contains("dark"),
    reminderTime: "20:00",
  });

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

    const loadLearningProfile = async () => {
      try {
        const response = await getLearningProfile();
        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          setLearningGoals({
            primaryFocus: profile.learningGoal || "general",
            dailyWordTarget: profile.dailyGoal || 20,
            dailyReviewTarget: profile.reviewPerDay || 40,
          });
          setAppSettings((prev) => ({
            ...prev,
            emailNotifications: profile.preferences?.emailNotification ?? profile.preferences?.pushNotification ?? true,
            reminderTime: profile.reminderTime || "20:00",
          }));
        }
      } catch (error) {
        console.error("Failed to load learning profile:", error);
      }
    };

    loadProfile();
    loadLearningProfile();
  }, [hasEditedProfile, updateUser]);

  const handleSave = async () => {
    setLoading((prev) => ({ ...prev, profile: true }));
    setProfileErrors({});
    try {
      const response = await updateProfile({
        name: formData.name,
      });
      if (response.data.success) {
        updateUser({ name: formData.name });
        toast.success("Display name updated successfully!");
        setHasEditedProfile(false);
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setProfileErrors(fieldErrors);
      }
      toast.error(getErrorMessage(error, "Failed to save profile name"));
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const handleSaveAvatar = async () => {
    setAvatarLoading(true);
    setProfileErrors((prev) => ({ ...prev, avatar: "" }));
    try {
      const response = await updateProfile({
        avatar: formData.avatar || null,
      });
      if (response.data.success) {
        updateUser({ avatar: response.data.data.avatar });
        toast.success("Avatar updated successfully!");
        setShowAvatarInput(false);
      }
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors.avatar) {
        setProfileErrors((prev) => ({ ...prev, avatar: fieldErrors.avatar }));
      }
      toast.error(getErrorMessage(error, "Failed to update avatar"));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!emailChange.newEmail) {
      toast.error("Please enter a new email address.");
      return;
    }
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
    if (!emailChange.newEmail || !emailChange.otp) {
      toast.error("Please enter new email and OTP code.");
      return;
    }
    setLoading((prev) => ({ ...prev, confirmEmail: true }));
    setEmailChangeErrors({});
    try {
      const response = await confirmEmailChange({
        newEmail: emailChange.newEmail,
        otp: emailChange.otp,
      });
      if (response.data.success) {
        updateUser({ email: emailChange.newEmail });
        setEmailChange({ newEmail: emailChange.newEmail, otp: "" });
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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const handleGoalChange = (field: string, value: any) => {
    const updatedGoals = { ...learningGoals, [field]: value };
    setLearningGoals(updatedGoals);

    debouncedUpdate({
      learningGoal: updatedGoals.primaryFocus as any,
      dailyGoal: updatedGoals.dailyWordTarget,
      reviewPerDay: updatedGoals.dailyReviewTarget,
    });
  };

  const handleAppSettingChange = (field: string, value: any) => {
    const updatedSettings = { ...appSettings, [field]: value };
    setAppSettings(updatedSettings);

    if (field === "darkMode") {
      if (value) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
      return;
    }

    debouncedUpdate({
      reminderTime: updatedSettings.reminderTime,
      preferences: {
        pushNotification: updatedSettings.emailNotifications,
        emailNotification: updatedSettings.emailNotifications,
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
        setHasEditedProfile(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const isEmailChanged = emailChange.newEmail !== (user?.email || "");
  const isNameChanged = formData.name.trim() !== (user?.name || "").trim() && formData.name.trim() !== "";
  const defaultAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200";

  return (
    <div className="max-w-7xl mx-auto w-full">
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8">Settings</h2>
      
      {/* Profile Header Banner */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-primary p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <img 
            alt="Profile Picture" 
            className="w-24 h-24 rounded-full object-cover border-4 border-surface-container shadow-sm bg-slate-50" 
            src={formData.avatar || user?.avatar || defaultAvatar}
          />
        </div>
        
        <div className="text-center sm:text-left flex-1">
          <h3 className="font-headline-md text-headline-md text-on-surface">{user?.name || "Learner"}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Intermediate Learner • Joined 2023</p>
          
          {showAvatarInput && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center w-full max-w-md mx-auto sm:mx-0 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAvatarSource("upload")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex-1 sm:flex-initial ${
                    avatarSource === "upload" ? "bg-[#1000a3] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  File
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSource("url")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex-1 sm:flex-initial ${
                    avatarSource === "url" ? "bg-[#1000a3] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  URL
                </button>
              </div>

              {avatarSource === "upload" ? (
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                  />
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder="Enter avatar image URL..." 
                  className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm w-full"
                  value={formData.avatar || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, avatar: e.target.value });
                    setHasEditedProfile(true);
                    if (profileErrors.avatar) {
                      setProfileErrors((prev) => ({ ...prev, avatar: "" }));
                    }
                  }}
                />
              )}
              
              <button 
                onClick={handleSaveAvatar}
                disabled={avatarLoading}
                className="px-3 py-1 bg-[#1000a3] text-white text-xs rounded-lg hover:shadow-lg transition-all w-full sm:w-auto disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {avatarLoading ? "Saving..." : "Done"}
              </button>
            </div>
          )}
          {profileErrors.avatar && <p className="text-xs text-error mt-1">{profileErrors.avatar}</p>}
        </div>
        
        <div className="sm:ml-auto">
          <button 
            onClick={() => setShowAvatarInput(!showAvatarInput)}
            className="px-4 py-2 border border-outline text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors"
          >
            Change Picture
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column: Personal Info & Goals */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Personal Information */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6">Personal Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2">Display Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-surface-container-low border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-on-surface"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setHasEditedProfile(true);
                    if (profileErrors.name) {
                      setProfileErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                />
                {profileErrors.name && <p className="text-xs text-error mt-1">{profileErrors.name}</p>}
              </div>
              
              <div>
                <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 bg-surface-container-low border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-on-surface"
                  value={emailChange.newEmail}
                  onChange={(e) => {
                    setEmailChange({ ...emailChange, newEmail: e.target.value });
                    if (emailChangeErrors.newEmail) {
                      setEmailChangeErrors((prev) => ({ ...prev, newEmail: "" }));
                    }
                  }}
                />
                {emailChangeErrors.newEmail && <p className="text-xs text-error mt-1">{emailChangeErrors.newEmail}</p>}
              </div>

              {isEmailChanged && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3 mt-4">
                  <p className="text-xs text-on-surface-variant font-medium">
                    You are changing your email. Verification is required.
                  </p>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">OTP Code</label>
                    <input 
                      type="text" 
                      placeholder="6-digit code"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-on-surface"
                      value={emailChange.otp}
                      onChange={(e) => {
                        setEmailChange({ ...emailChange, otp: e.target.value });
                        if (emailChangeErrors.otp) {
                          setEmailChangeErrors((prev) => ({ ...prev, otp: "" }));
                        }
                      }}
                    />
                    {emailChangeErrors.otp && <p className="text-xs text-error mt-1">{emailChangeErrors.otp}</p>}
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={handleRequestEmailChange}
                      disabled={loading.requestEmail}
                      className="px-4 py-2 border border-[#1000a3] text-[#1000a3] hover:bg-[#1000a3]/5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {loading.requestEmail ? "Sending..." : "Send OTP"}
                    </button>
                    <button 
                      type="button"
                      onClick={handleConfirmEmailChange}
                      disabled={loading.confirmEmail || !emailChange.otp}
                      className="px-4 py-2 bg-[#8127cf] text-white hover:bg-[#8127cf]/90 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {loading.confirmEmail ? "Confirming..." : "Confirm Email"}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleSave}
                  disabled={loading.profile || !isNameChanged}
                  className="px-6 py-2 bg-[#1000a3] text-white rounded-lg font-label-md text-label-md font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.profile ? "Saving..." : "Save Changes"}
                </button>
                {isEmailChanged && (
                  <button 
                    onClick={() => setEmailChange({ newEmail: user?.email || "", otp: "" })}
                    className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg font-label-md text-label-md transition-all"
                  >
                    Cancel Email Edit
                  </button>
                )}
              </div>
            </div>
          </section>
          
          {/* Learning Goals */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-secondary p-6">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6">Learning Goals</h4>
            <div className="space-y-6">
              <div>
                <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2">Primary Focus</label>
                <select 
                  className="w-full px-4 py-2 bg-surface-container-low border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-on-surface"
                  value={learningGoals.primaryFocus}
                  onChange={(e) => handleGoalChange("primaryFocus", e.target.value)}
                >
                  <option value="general">General Vocabulary</option>
                  <option value="ielts">IELTS Preparation</option>
                  <option value="toeic">TOEIC Preparation</option>
                  <option value="business">Business English</option>
                  <option value="travel">Travel English</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-label-md text-label-md text-on-surface font-semibold">Daily New Words Limit</label>
                  <span className="font-label-md text-label-md text-primary font-bold">{learningGoals.dailyWordTarget} words</span>
                </div>
                <input 
                  className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
                  max="100" 
                  min="1" 
                  type="range" 
                  value={learningGoals.dailyWordTarget}
                  onChange={(e) => handleGoalChange("dailyWordTarget", parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-label-md text-label-md text-on-surface font-semibold">Daily Review Words Limit</label>
                  <span className="font-label-md text-label-md text-secondary font-bold">{learningGoals.dailyReviewTarget} reviews</span>
                </div>
                <input 
                  className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary" 
                  max="200" 
                  min="5" 
                  type="range" 
                  value={learningGoals.dailyReviewTarget}
                  onChange={(e) => handleGoalChange("dailyReviewTarget", parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>5</span>
                  <span>200</span>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Sidebar Column: Settings & Stats */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Streak Card */}
          <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-xl text-on-primary shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-label-md text-label-md font-semibold opacity-90 mb-1">Current Streak</h4>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg font-bold">14</span>
                <span className="font-body-md text-body-md opacity-90">Days</span>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-20" data-icon="local_fire_department">local_fire_department</span>
          </div>
          
          {/* App Settings */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6">App Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h5 className="font-label-md text-label-md font-semibold text-on-surface">Email Notifications</h5>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Nhận email nhắc nhở ôn tập từ vựng hàng ngày</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer font-sans select-none">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={appSettings.emailNotifications}
                    onChange={(e) => handleAppSettingChange("emailNotifications", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h5 className="font-label-md text-label-md font-semibold text-on-surface">Dark Mode</h5>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Switch to dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer font-sans select-none">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={appSettings.darkMode}
                    onChange={(e) => handleAppSettingChange("darkMode", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="pt-2">
                <label className="block font-label-md text-label-md text-on-surface font-semibold mb-2">Reminder Time</label>
                <input 
                  className="w-full px-4 py-2 bg-surface-container-low border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-on-surface" 
                  type="time" 
                  value={appSettings.reminderTime}
                  onChange={(e) => handleAppSettingChange("reminderTime", e.target.value)}
                />
              </div>
            </div>
          </section>
          
          {/* Account Actions */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 p-6">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-error text-error rounded-lg font-label-md text-label-md font-semibold hover:bg-error-container/20 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined" data-icon="logout">logout</span>
              Log Out
            </button>
          </section>
        </div>
      </div>

      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
