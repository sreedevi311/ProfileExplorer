import { useState, useEffect, useRef } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { User, Mail, Phone, Info, MapPin, Edit,LogOut } from "lucide-react";

export default function ViewProfile({ profile, isOpen, onClose, isEditable, loggedUserEmail, onSuccess,onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    profileFile: null,
    fullName: "",
    email: "",
    phone: "",
    about: "",
    location: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  
  // Populate form when profile changes
  useEffect(() => {
    if (!profile) return;
    setFormData({
      profileFile: null,
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phoneNumber || "",
      about: profile.aboutMe || "",
      location: profile.location || "",
    });
    setPreviewUrl(profile.profilePicture || null);
    setIsEditing(false);
    setErrors({});
  }, [profile]);

  // Update preview when a new file is selected
  useEffect(() => {
    if (formData.profileFile) {
      const url = URL.createObjectURL(formData.profileFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.profileFile]);

  const handleFilePick = (files) => {
    if (!files || !files[0]) return;
    setFormData({ ...formData, profileFile: files[0] });
  };


 const handleSave = async () => {
  // validate inputs
  const validationErrors = {};
  if (!formData.fullName.trim()) validationErrors.fullName = "Full name required";
  if (!formData.email.includes("@")) validationErrors.email = "Valid email required";
  if (!/^\d{10}$/.test(formData.phone)) validationErrors.phone = "Valid 10-digit phone required";

  if (Object.keys(validationErrors).length) {
    setErrors(validationErrors);
    return;
  }

  // prepare updated object
  const updated = {
    _id: profile._id,
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    about: formData.about,
    location: formData.location,
    profilePicture: previewUrl,
    newProfileFile: formData.profileFile, // if a new file was uploaded
  };

  onSuccess(updated);
};


  if (!isOpen || !profile) return null;

  const isOwnProfile = profile.email === loggedUserEmail;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ✕
        </button>

        {/* Avatar */}
        {isEditing ? (
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-teal-500 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-full h-full text-gray-400 scale-125" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-teal-500 p-2 rounded-full border-2 border-white dark:border-gray-800 shadow hover:bg-teal-600"
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
        ) : (
          <div className="flex justify-center mb-4">
            <img
              src={profile.profilePicture}
              alt={profile.fullName}
              className="w-28 h-28 rounded-full border-4 border-teal-500 object-cover"
            />
          </div>
        )}

        {/* Fields */}
        {[
          { label: "Full Name", icon: User, key: "fullName", type: "input" },
          { label: "About Me", icon: Info, key: "about", type: "textarea" },
          { label: "Location", icon: MapPin, key: "location", type: "input" },
          { label: "Email", icon: Mail, key: "email", type: "input" },
          { label: "Phone", icon: Phone, key: "phone", type: "input" },
        ].map(({ label, icon: Icon, key, type }) => (
          <div className="flex items-center gap-2 mb-2 text-teal-600" key={key}>
            <Icon className="h-5 w-5" />
            {isEditing ? (
              <div className="flex flex-col w-full">
                {type === "input" ? (
                  <input
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                  />
                ) : (
                  <textarea
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-gray-700 dark:border-gray-600"
                  />
                )}
                {errors[key] && <p className="text-red-500 text-sm">{errors[key]}</p>}
              </div>
            ) : (
              <span>
                {profile[key] || profile[`${key}Number`] || (key === "about" ? profile.aboutMe : "")}
              </span>
            )}
          </div>
        ))}

        <div className="flex justify-between gap-2 mt-4">
  {/* Edit/Save Button */}
  <button
  onClick={isOwnProfile ? (isEditing ? handleSave : () => setIsEditing(true)) : undefined}
  disabled={!isOwnProfile}
  className={`flex-1 flex justify-center py-2 rounded-lg transition 
    ${isOwnProfile
      ? "bg-teal-500 text-white hover:bg-teal-600"
      : "bg-gray-300 text-gray-600 cursor-not-allowed"}
    ${isEditing ? "ml-6" : ""}`} // only add ml-6 when editing (Save)
>
  {isOwnProfile ? (
    isEditing ? (
      "Save"
    ) : (
      <span className="flex items-center gap-2">
        <Edit className="h-5 w-5" />
        Edit
      </span>
    )
  ) : (
    "Edit"
  )}
</button>


  {/* Logout Button: only show when NOT editing */}
  {isOwnProfile && (
    <button
      onClick={onLogout}
      className="flex-1 flex justify-center py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
    >
      <span className="flex items-center gap-2">
        <LogOut className="h-5 w-5" />
        Logout
      </span>
    </button>
  )}
</div>

      </div>
    </div>
  );
}
