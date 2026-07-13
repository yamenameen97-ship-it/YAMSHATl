import { bz as useNavigate, bG as useToast, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout } from "../index-CbZjTFV4.js";
import { c as createGroup, O as uploadGroupImage } from "./groups-iGSDUnA6.js";
const CreateGroup = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [formData, setFormData] = reactExports.useState({
    name: "",
    description: "",
    category: "عام",
    isPublic: true,
    image: null
  });
  const [loading, setLoading] = reactExports.useState(false);
  const [imagePreview, setImagePreview] = reactExports.useState(null);
  const categories = [
    { id: 1, name: "عام" },
    { id: 2, name: "دراسة" },
    { id: 3, name: "تقنية" },
    { id: 4, name: "ألعاب" },
    { id: 5, name: "تصميم" },
    { id: 6, name: "ترفيه" }
  ];
  const handleInputChange = reactExports.useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }, []);
  const handleImageChange = reactExports.useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      pushToast?.({ type: "warning", title: "الصورة كبيرة", description: "الحد الأقصى 5 ميجابايت" });
      return;
    }
    setFormData((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }, [pushToast]);
  const handleSubmit = reactExports.useCallback(async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      pushToast?.({ type: "warning", title: "خطأ", description: "أدخل اسم المجموعة" });
      return;
    }
    setLoading(true);
    try {
      const response = await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        is_public: formData.isPublic
      });
      const body = response?.data || response || {};
      const newGroupId = body.id || body.group_id || body.group?.id;
      if (newGroupId && formData.image) {
        try {
          await uploadGroupImage(newGroupId, formData.image, "avatar");
        } catch (imgErr) {
          console.warn("Group created but image upload failed:", imgErr);
          pushToast?.({
            type: "warning",
            title: "تنبيه",
            description: "تم إنشاء المجموعة لكن فشل رفع الصورة. يمكنك رفعها لاحقاً من الإعدادات."
          });
        }
      }
      if (newGroupId) {
        pushToast?.({
          type: "success",
          title: "تم",
          description: "تم إنشاء المجموعة بنجاح"
        });
        navigate(`/groups/${newGroupId}/chat`, { replace: true });
      } else {
        pushToast?.({
          type: "warning",
          title: "تنبيه",
          description: "تم الإنشاء لكن لم نستلم معرّف المجموعة من الخادم"
        });
        navigate("/groups");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      pushToast?.({
        type: "error",
        title: "خطأ",
        description: error?.message || "فشل إنشاء المجموعة"
      });
    } finally {
      setLoading(false);
    }
  }, [formData, pushToast, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "yam-create-group-page",
      dir: "rtl",
      style: { fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-create-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-back-btn", onClick: () => navigate(-1), "aria-label": "رجوع", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "❮" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "إنشاء مجموعة جديدة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px" } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "yam-create-form", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-form-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-form-label", children: "صورة المجموعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-image-upload-area", children: imagePreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-image-preview", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imagePreview, alt: "معاينة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "yam-remove-image-btn",
                  onClick: () => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, image: null }));
                  },
                  "aria-label": "حذف الصورة",
                  children: "✕"
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yam-upload-label", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  onChange: handleImageChange,
                  style: { display: "none" }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-upload-icon", children: "📸" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-upload-text", children: "اختر صورة" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-form-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-form-label", children: "اسم المجموعة *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                name: "name",
                value: formData.name,
                onChange: handleInputChange,
                placeholder: "مثال: مطورين العرب",
                className: "yam-form-input",
                maxLength: 100,
                required: true,
                dir: "rtl"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-char-count", children: [
              formData.name.length,
              "/100"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-form-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-form-label", children: "وصف المجموعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                name: "description",
                value: formData.description,
                onChange: handleInputChange,
                placeholder: "أضف وصفاً للمجموعة...",
                className: "yam-form-textarea",
                maxLength: 500,
                rows: 4,
                dir: "rtl"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-char-count", children: [
              formData.description.length,
              "/500"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-form-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-form-label", children: "التصنيف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                name: "category",
                value: formData.category,
                onChange: handleInputChange,
                className: "yam-form-select",
                dir: "rtl",
                children: categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: cat.name, children: cat.name }, cat.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-form-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-form-label", children: "الخصوصية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-privacy-options", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yam-privacy-option", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "radio",
                    name: "isPublic",
                    value: "true",
                    checked: formData.isPublic === true,
                    onChange: () => setFormData((prev) => ({ ...prev, isPublic: true }))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عامة - يمكن لأي شخص الانضمام" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yam-privacy-option", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "radio",
                    name: "isPublic",
                    value: "false",
                    checked: formData.isPublic === false,
                    onChange: () => setFormData((prev) => ({ ...prev, isPublic: false }))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "خاصة - بالدعوة فقط" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-form-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "yam-btn-secondary",
                onClick: () => navigate(-1),
                disabled: loading,
                children: "إلغاء"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                className: "yam-btn-primary",
                disabled: loading,
                children: loading ? "جاري الإنشاء..." : "إنشاء المجموعة"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "40px" } })
      ]
    }
  ) });
};
export {
  CreateGroup as default
};
