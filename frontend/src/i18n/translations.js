/* ============================================================
   Yamshat — قاموس الترجمات الموحّد
   يدعم: العربية، الإنجليزية، الفرنسية، التركية، الإسبانية،
        الأردية، الإندونيسية، الروسية
   ============================================================ */

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية',     nativeName: 'العربية',    dir: 'rtl', flag: '🇸🇦' },
  { code: 'en', name: 'English',     nativeName: 'English',    dir: 'ltr', flag: '🇬🇧' },
  { code: 'fr', name: 'Français',    nativeName: 'Français',   dir: 'ltr', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe',      nativeName: 'Türkçe',     dir: 'ltr', flag: '🇹🇷' },
  { code: 'es', name: 'Español',     nativeName: 'Español',    dir: 'ltr', flag: '🇪🇸' },
  { code: 'ur', name: 'اردو',         nativeName: 'اردو',        dir: 'rtl', flag: '🇵🇰' },
  { code: 'id', name: 'Indonesia',   nativeName: 'Bahasa Indonesia', dir: 'ltr', flag: '🇮🇩' },
  { code: 'ru', name: 'Русский',      nativeName: 'Русский',     dir: 'ltr', flag: '🇷🇺' },
];

export const TRANSLATIONS = {
  ar: {
    common: {
      save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
      confirm: 'تأكيد', back: 'رجوع', next: 'التالي', search: 'بحث',
      loading: 'جارٍ التحميل...', success: 'تم بنجاح', error: 'حدث خطأ',
      yes: 'نعم', no: 'لا', close: 'إغلاق', send: 'إرسال',
    },
    nav: {
      home: 'الرئيسية', reels: 'الريلز', live: 'مباشر', inbox: 'الدردشة',
      notifications: 'الإشعارات', users: 'المستخدمون', groups: 'المجموعات',
      stories: 'القصص', profile: 'الملف الشخصي', settings: 'الإعدادات',
    },
    settings: {
      title: 'الإعدادات', language: 'اللغة', theme: 'المظهر',
      languageLabel: 'لغة الواجهة',
      languageHint: 'سيتم تطبيق اللغة فوراً على كافة شاشات المنصة',
      languageSaved: 'تم تغيير اللغة بنجاح',
      security: 'الأمان', notifications: 'الإشعارات', privacy: 'الخصوصية',
      account: 'الحساب', appearance: 'المظهر',
    },
  },
  en: {
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      confirm: 'Confirm', back: 'Back', next: 'Next', search: 'Search',
      loading: 'Loading...', success: 'Success', error: 'Error',
      yes: 'Yes', no: 'No', close: 'Close', send: 'Send',
    },
    nav: {
      home: 'Home', reels: 'Reels', live: 'Live', inbox: 'Chat',
      notifications: 'Alerts', users: 'Users', groups: 'Groups',
      stories: 'Stories', profile: 'Profile', settings: 'Settings',
    },
    settings: {
      title: 'Settings', language: 'Language', theme: 'Theme',
      languageLabel: 'Interface language',
      languageHint: 'Language applies instantly to all platform screens',
      languageSaved: 'Language changed successfully',
      security: 'Security', notifications: 'Notifications', privacy: 'Privacy',
      account: 'Account', appearance: 'Appearance',
    },
  },
  fr: {
    common: {
      save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier',
      confirm: 'Confirmer', back: 'Retour', next: 'Suivant', search: 'Rechercher',
      loading: 'Chargement...', success: 'Succès', error: 'Erreur',
      yes: 'Oui', no: 'Non', close: 'Fermer', send: 'Envoyer',
    },
    nav: {
      home: 'Accueil', reels: 'Reels', live: 'En direct', inbox: 'Discussion',
      notifications: 'Notifications', users: 'Utilisateurs', groups: 'Groupes',
      stories: 'Stories', profile: 'Profil', settings: 'Paramètres',
    },
    settings: {
      title: 'Paramètres', language: 'Langue', theme: 'Thème',
      languageLabel: 'Langue de l\'interface',
      languageHint: 'La langue s\'applique instantanément à toutes les pages',
      languageSaved: 'Langue modifiée avec succès',
      security: 'Sécurité', notifications: 'Notifications', privacy: 'Confidentialité',
      account: 'Compte', appearance: 'Apparence',
    },
  },
  tr: {
    common: {
      save: 'Kaydet', cancel: 'İptal', delete: 'Sil', edit: 'Düzenle',
      confirm: 'Onayla', back: 'Geri', next: 'İleri', search: 'Ara',
      loading: 'Yükleniyor...', success: 'Başarılı', error: 'Hata',
      yes: 'Evet', no: 'Hayır', close: 'Kapat', send: 'Gönder',
    },
    nav: {
      home: 'Ana Sayfa', reels: 'Reels', live: 'Canlı', inbox: 'Sohbet',
      notifications: 'Bildirimler', users: 'Kullanıcılar', groups: 'Gruplar',
      stories: 'Hikayeler', profile: 'Profil', settings: 'Ayarlar',
    },
    settings: {
      title: 'Ayarlar', language: 'Dil', theme: 'Tema',
      languageLabel: 'Arayüz dili',
      languageHint: 'Dil tüm platform ekranlarına anında uygulanır',
      languageSaved: 'Dil başarıyla değiştirildi',
      security: 'Güvenlik', notifications: 'Bildirimler', privacy: 'Gizlilik',
      account: 'Hesap', appearance: 'Görünüm',
    },
  },
  es: {
    common: {
      save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar',
      confirm: 'Confirmar', back: 'Atrás', next: 'Siguiente', search: 'Buscar',
      loading: 'Cargando...', success: 'Éxito', error: 'Error',
      yes: 'Sí', no: 'No', close: 'Cerrar', send: 'Enviar',
    },
    nav: {
      home: 'Inicio', reels: 'Reels', live: 'En vivo', inbox: 'Chat',
      notifications: 'Notificaciones', users: 'Usuarios', groups: 'Grupos',
      stories: 'Historias', profile: 'Perfil', settings: 'Ajustes',
    },
    settings: {
      title: 'Ajustes', language: 'Idioma', theme: 'Tema',
      languageLabel: 'Idioma de la interfaz',
      languageHint: 'El idioma se aplica al instante en toda la plataforma',
      languageSaved: 'Idioma cambiado con éxito',
      security: 'Seguridad', notifications: 'Notificaciones', privacy: 'Privacidad',
      account: 'Cuenta', appearance: 'Apariencia',
    },
  },
  ur: {
    common: {
      save: 'محفوظ کریں', cancel: 'منسوخ', delete: 'حذف', edit: 'ترمیم',
      confirm: 'تصدیق', back: 'واپس', next: 'اگلا', search: 'تلاش',
      loading: 'لوڈ ہو رہا ہے...', success: 'کامیاب', error: 'خرابی',
      yes: 'ہاں', no: 'نہیں', close: 'بند کریں', send: 'بھیجیں',
    },
    nav: {
      home: 'مرکزی', reels: 'ریلز', live: 'لائیو', inbox: 'چیٹ',
      notifications: 'اطلاعات', users: 'صارفین', groups: 'گروپ',
      stories: 'کہانیاں', profile: 'پروفائل', settings: 'ترتیبات',
    },
    settings: {
      title: 'ترتیبات', language: 'زبان', theme: 'تھیم',
      languageLabel: 'انٹرفیس کی زبان',
      languageHint: 'زبان فوری طور پر تمام پلیٹ فارم اسکرینز پر لاگو ہوتی ہے',
      languageSaved: 'زبان کامیابی سے تبدیل ہو گئی',
      security: 'سیکورٹی', notifications: 'اطلاعات', privacy: 'پرائیویسی',
      account: 'اکاؤنٹ', appearance: 'ظہور',
    },
  },
  id: {
    common: {
      save: 'Simpan', cancel: 'Batal', delete: 'Hapus', edit: 'Edit',
      confirm: 'Konfirmasi', back: 'Kembali', next: 'Berikutnya', search: 'Cari',
      loading: 'Memuat...', success: 'Berhasil', error: 'Kesalahan',
      yes: 'Ya', no: 'Tidak', close: 'Tutup', send: 'Kirim',
    },
    nav: {
      home: 'Beranda', reels: 'Reels', live: 'Langsung', inbox: 'Obrolan',
      notifications: 'Notifikasi', users: 'Pengguna', groups: 'Grup',
      stories: 'Cerita', profile: 'Profil', settings: 'Pengaturan',
    },
    settings: {
      title: 'Pengaturan', language: 'Bahasa', theme: 'Tema',
      languageLabel: 'Bahasa antarmuka',
      languageHint: 'Bahasa langsung diterapkan ke seluruh platform',
      languageSaved: 'Bahasa berhasil diubah',
      security: 'Keamanan', notifications: 'Notifikasi', privacy: 'Privasi',
      account: 'Akun', appearance: 'Tampilan',
    },
  },
  ru: {
    common: {
      save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Изменить',
      confirm: 'Подтвердить', back: 'Назад', next: 'Далее', search: 'Поиск',
      loading: 'Загрузка...', success: 'Успешно', error: 'Ошибка',
      yes: 'Да', no: 'Нет', close: 'Закрыть', send: 'Отправить',
    },
    nav: {
      home: 'Главная', reels: 'Reels', live: 'Прямой эфир', inbox: 'Чат',
      notifications: 'Уведомления', users: 'Пользователи', groups: 'Группы',
      stories: 'Истории', profile: 'Профиль', settings: 'Настройки',
    },
    settings: {
      title: 'Настройки', language: 'Язык', theme: 'Тема',
      languageLabel: 'Язык интерфейса',
      languageHint: 'Язык применяется ко всем экранам платформы мгновенно',
      languageSaved: 'Язык успешно изменён',
      security: 'Безопасность', notifications: 'Уведомления', privacy: 'Конфиденциальность',
      account: 'Аккаунт', appearance: 'Внешний вид',
    },
  },
};

/** Resolve a nested key like 'settings.languageLabel' from a dictionary */
export function resolveKey(dict, key) {
  if (!dict || !key) return null;
  return key.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : null), dict);
}

/** Get a translation; fall back to Arabic, then English, then the key itself */
export function t(lang, key) {
  const primary = resolveKey(TRANSLATIONS[lang], key);
  if (primary != null) return primary;
  const ar = resolveKey(TRANSLATIONS.ar, key);
  if (ar != null) return ar;
  const en = resolveKey(TRANSLATIONS.en, key);
  return en != null ? en : key;
}

export function getLanguageMeta(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
