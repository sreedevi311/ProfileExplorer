import React, { useState, useEffect, useRef } from "react";
import ViewProfile from "./ViewProfile";
import {
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/solid";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    newProfileFile: null, // for Cloudinary file
    fullName: "",
    emailOrPhone: "",
    emailMode: true, // true = email, false = phone
    password: "",
    rePassword: "",
  });
  const [errors, setErrors] = useState({});

  // === API Calls ===
  const fetchProfiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/profiles");
      const data = await res.json();
      setProfiles(data);
    } catch (err) {
      console.error("Failed to fetch profiles:", err);
    }
  };

const uploadToCloudinary = async (file) => {
  if (!file) return null;
  const data = new FormData();
  data.append("file", file);

  const res = await fetch("http://localhost:5000/upload", {
    method: "POST",
    body: data,
  });
  const json = await res.json();
  return json.url; // Cloudinary URL
};


 const signup = async () => {
  try {
    let profilePictureUrl = null;
    if (formData.newProfileFile) {
      profilePictureUrl = await uploadToCloudinary(formData.newProfileFile);
    }

    const body = {
      fullName: formData.fullName,
      password: formData.password,
      emailOrPhone: formData.emailOrPhone,
      emailMode: formData.emailMode,
      profilePicture: profilePictureUrl,
    };

    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data);
      setLoggedIn(true);
      setShowModal(false);
      fetchProfiles();
    } else {
      alert(data.message || "Signup failed");
    }
  } catch (err) {
    console.error("Signup error:", err);
  }
};


  const login = async () => {
    try {
      const payload = {
        password: formData.password,
        emailOrPhone: formData.emailOrPhone,
        emailMode: formData.emailMode,
      };
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setLoggedIn(true);
        setShowModal(false);
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

const handleLogout = () => {
  setUser(null);             // clear logged-in user
  setLoggedIn(false);        // update auth state
  setProfileOpen(false);     // close the modal if open
};



const saveProfile = async (updatedProfile) => {
  try {
    let profilePictureUrl = updatedProfile.profilePicture;
    if (updatedProfile.newProfileFile) {
      profilePictureUrl = await uploadToCloudinary(updatedProfile.newProfileFile);
    }

    const payload = { ...updatedProfile, profilePicture: profilePictureUrl };
    delete payload.newProfileFile;

    const res = await fetch(`http://localhost:5000/profiles/${updatedProfile._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      fetchProfiles();
      setProfileOpen(false);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } else {
      const errData = await res.json();
      console.error("Failed to update profile:", errData);
    }
  } catch (err) {
    console.error("Save error:", err);
  }
};


  // === Handlers ===
  const toggleDarkMode = () => setDarkMode((s) => !s);
  const handleLogin = () => { setIsSignup(false); setShowModal(true); }; 
  const openProfile = (profile) => { setSelectedProfile(profile); setProfileOpen(true); };

  const handleFilePick = (files) => {
    if (!files || !files[0]) return;
    setFormData({ ...formData, newProfileFile: files[0] });
     const url = URL.createObjectURL(files[0]);
  setPreviewUrl(url);
  };

  const handleSubmit = () => {
    const newErr = {};

    if (isSignup) {
      if (!formData.fullName.trim()) newErr.fullName = "Full name required";
      if (formData.emailMode) {
        if (!formData.emailOrPhone.includes("@")) newErr.emailOrPhone = "Valid email required";
      } else {
        if (!/^\d{10}$/.test(formData.emailOrPhone)) newErr.emailOrPhone = "Valid 10-digit phone required";
      }
      if (!formData.password) newErr.password = "Password required";
      if (formData.password !== formData.rePassword) newErr.rePassword = "Passwords do not match";
    } else {
      if (!formData.emailOrPhone)
        newErr.emailOrPhone = formData.emailMode ? "Email required" : "Phone number required";
      if (formData.emailMode && !formData.emailOrPhone.includes("@")) newErr.emailOrPhone = "Valid email required";
      if (!formData.emailMode && !/^\d{10}$/.test(formData.emailOrPhone)) newErr.emailOrPhone = "Valid 10-digit phone required";
      if (!formData.password) newErr.password = "Password required";
    }

    if (Object.keys(newErr).length) {
      setErrors(newErr);
      return;
    }

    setErrors({});
    isSignup ? signup() : login();
  };

  // === Effects ===
  useEffect(() => { fetchProfiles(); }, []);
  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (!el) return;
    let last = el.scrollTop;
    const onScroll = () => {
      const curr = el.scrollTop;
      setShowHeader(curr <= last || curr === 0);
      last = curr;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white transition-colors duration-300">
        {/* HEADER */}
        <header
          className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-150 ${
            showHeader ? "translate-y-0" : "-translate-y-full"
          } bg-white dark:bg-gray-800 shadow`}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">Profile Explorer</h1>
            <div className="flex items-center space-x-4">
              <button onClick={toggleDarkMode} aria-label="Toggle theme" className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-teal-200 dark:hover:bg-teal-600 transition">
                {darkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-800" />}
              </button>

              {loggedIn ? (
                <button onClick={() => openProfile(user)} className="p-1 flex items-center space-x-1">
                  <UserCircleIcon className="h-8 w-8 text-teal-500" />
                </button>
              ) : (
                <button onClick={handleLogin} className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold">Login</button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main id="main-scroll" className="pt-24 px-6 pb-6 h-screen overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profiles.filter((p) => !user || p._id !== user._id) // ✅ exclude the logged-in user
            .map((p, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 flex flex-col items-center text-center hover:shadow-xl transition">
                <img src={p.profilePicture} alt={p.fullName} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-teal-500" />
                <h2 className="font-bold text-lg">{p.fullName}</h2>
                <div className="mt-4 w-full flex items-center justify-center space-x-3">
                  <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg" onClick={() => openProfile(p)}>View</button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Profile Modal */}
        {selectedProfile && (
          <ViewProfile
            profile={selectedProfile}
            isOpen={isProfileOpen}
            onClose={() => setProfileOpen(false)}
            isEditable={loggedIn}
            loggedUserEmail={user ? user.email : ""}
            onSuccess={saveProfile}
            onLogout={handleLogout}
          />
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-teal-600 text-center p-8 rounded-xl shadow-lg animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-white text-lg font-semibold">Successfully Saved</p>
            </div>
          </div>
        )}

        {/* Login / Signup Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-4">
                {isSignup ? "Sign Up" : "Login"}
              </h2>

              <div className="space-y-3">
                {isSignup ? (
                  <>
                    {/* Avatar uploader */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full border-4 border-teal-500 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="w-full h-full text-gray-400 scale-125" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 bg-teal-500 p-2 rounded-full border-2 border-white dark:border-gray-800 shadow hover:bg-teal-600"
                          aria-label="Upload profile picture"
                        >
                          <ArrowUpTrayIcon className="h-5 w-5 text-white" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFilePick(e.target.files)}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Full name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm">{errors.fullName}</p>
                    )}

                    {/* Email/Phone single input */}
                    <div className="flex flex-col w-full">
                      <div className="flex items-center space-x-1 mb-2">
                        <label
                          onClick={() =>
                            setFormData({ ...formData, emailMode: true, emailOrPhone: "" })
                          }
                          className={`cursor-pointer font-semibold ${
                            formData.emailMode
                              ? "text-teal-500"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          Email
                        </label>
                        <span className="text-gray-500 dark:text-gray-400">/</span>
                        <label
                          onClick={() =>
                            setFormData({ ...formData, emailMode: false, emailOrPhone: "" })
                          }
                          className={`cursor-pointer font-semibold ${
                            !formData.emailMode
                              ? "text-teal-500"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          Phone
                        </label>
                      </div>
                      <input
                        type={formData.emailMode ? "email" : "tel"}
                        placeholder={formData.emailMode ? "Enter email" : "Enter phone number"}
                        value={formData.emailOrPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, emailOrPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                      />
                      {errors.emailOrPhone && (
                        <p className="text-red-500 text-sm mt-1">{errors.emailOrPhone}</p>
                      )}
                    </div>


                    <input
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password}</p>
                    )}

                    <input
                      type="password"
                      placeholder="Re-enter Password"
                      value={formData.rePassword}
                      onChange={(e) =>
                        setFormData({ ...formData, rePassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                    />
                    {errors.rePassword && (
                      <p className="text-red-500 text-sm">{errors.rePassword}</p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Email/Phone single input */}
                    <div className="flex flex-col w-full">
                      <div className="flex items-center space-x-1 mb-2">
                        <label
                          onClick={() =>
                            setFormData({ ...formData, emailMode: true, emailOrPhone: "" })
                          }
                          className={`cursor-pointer font-semibold ${
                            formData.emailMode
                              ? "text-teal-500"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          Email
                        </label>
                        <span className="text-gray-500 dark:text-gray-400">/</span>
                        <label
                          onClick={() =>
                            setFormData({ ...formData, emailMode: false, emailOrPhone: "" })
                          }
                          className={`cursor-pointer font-semibold ${
                            !formData.emailMode
                              ? "text-teal-500"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          Phone
                        </label>
                      </div>
                      <input
                        type={formData.emailMode ? "email" : "tel"}
                        placeholder={formData.emailMode ? "Enter email" : "Enter phone number"}
                        value={formData.emailOrPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, emailOrPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                      />
                      {errors.emailOrPhone && (
                        <p className="text-red-500 text-sm mt-1">{errors.emailOrPhone}</p>
                      )}
                    </div>

                    {/* Password */}
                    <input
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password}</p>
                    )}
                  </>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold"
                >
                  {isSignup ? "Sign Up" : "Login"}
                </button>

                <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-300">
                  {isSignup ? (
                    <>
                      Already have an account?{" "}
                      <button
                        className="text-teal-600 dark:text-teal-400 font-semibold"
                        onClick={() => setIsSignup(false)}
                      >
                        Login
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        className="text-teal-600 dark:text-teal-400 font-semibold"
                        onClick={() => setIsSignup(true)}
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
