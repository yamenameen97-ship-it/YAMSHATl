from pathlib import Path
import xml.etree.ElementTree as ET

ANDROID = 'http://schemas.android.com/apk/res/android'
APP = 'http://schemas.android.com/apk/res-auto'
ET.register_namespace('android', ANDROID)
ET.register_namespace('app', APP)

BASE = Path('/home/user/work/yamshat/project/mobile')
LAYOUT_DIR = BASE / 'app/src/main/res/layout'
JAVA_DIR = BASE / 'app/src/main/java/com/socialapp'

SRC_MAP = {
    '@android:drawable/ic_popup_sync': '@drawable/ic_ui_refresh',
    '@android:drawable/ic_menu_info_details': '@drawable/ic_ui_info',
    '@android:drawable/ic_lock_lock': '@drawable/ic_ui_lock',
    '@android:drawable/sym_action_call': '@drawable/ic_ui_call',
    '@android:drawable/presence_video_online': '@drawable/ic_ui_videocam',
    '@android:drawable/ic_menu_gallery': '@drawable/ic_ui_gallery',
    '@android:drawable/ic_btn_speak_now': '@drawable/ic_ui_mic',
    '@android:drawable/ic_menu_send': '@drawable/ic_ui_send',
    '@android:drawable/ic_menu_add': '@drawable/ic_ui_attach',
    '@android:drawable/ic_menu_manage': '@drawable/ic_ui_settings',
    '@android:drawable/ic_menu_view': '@drawable/ic_ui_send',
}

BUTTON_TEXT_MAP = {
    '🔔 الإشعارات': 'الإشعارات',
    '🔴 البث': 'البث',
    '👥 المجموعات': 'المجموعات',
    '🧑‍🤝‍🧑 الأصدقاء': 'الأصدقاء',
}


def lname(tag: str) -> str:
    return tag.split('}', 1)[-1]


def a(name: str) -> str:
    return f'{{{ANDROID}}}{name}'


def app(name: str) -> str:
    return f'{{{APP}}}{name}'


def patch_layout(path: Path):
    tree = ET.parse(path)
    root = tree.getroot()
    changed = False
    for elem in root.iter():
        tag = lname(elem.tag)
        view_id = elem.get(a('id'), '')
        src = elem.get(a('src'))
        if src in SRC_MAP:
            elem.set(a('src'), SRC_MAP[src])
            changed = True
        text = elem.get(a('text'))
        if text in BUTTON_TEXT_MAP:
            elem.set(a('text'), BUTTON_TEXT_MAP[text])
            changed = True
        if tag == 'MaterialCardView' and 'style' not in elem.attrib:
            elem.set('style', '@style/Widget.App.Card.Surface')
            changed = True
        elif tag == 'CardView' and 'style' not in elem.attrib:
            elem.set('style', '@style/Widget.App.Card.LegacySurface')
            changed = True
        elif tag == 'Button' and 'style' not in elem.attrib:
            elem.set('style', '@style/Widget.App.Button')
            changed = True
        elif tag == 'ImageButton' and 'style' not in elem.attrib:
            elem.set('style', '@style/Widget.App.IconButton')
            changed = True
        elif tag == 'EditText' and 'style' not in elem.attrib:
            style = '@style/Widget.App.InputField.Otp' if 'codeDigit' in view_id else '@style/Widget.App.InputField'
            elem.set('style', style)
            changed = True
        elif tag == 'ProgressBar' and 'style' not in elem.attrib:
            elem.set('style', '@style/Widget.App.Progress.Circular')
            changed = True
        if tag == 'ImageButton':
            if elem.get(a('background')) != '@drawable/bg_icon_button':
                elem.set(a('background'), '@drawable/bg_icon_button')
                changed = True
            if elem.get(a('tint')) != '@color/text_primary':
                elem.set(a('tint'), '@color/text_primary')
                changed = True
            if elem.get(a('scaleType')) != 'centerInside':
                elem.set(a('scaleType'), 'centerInside')
                changed = True
        if view_id.endswith('emptyState'):
            if 'style' not in elem.attrib:
                elem.set('style', '@style/Widget.App.EmptyState')
                changed = True
        if tag == 'ImageView' and elem.get(a('contentDescription')) == 'فارغ':
            elem.set(a('src'), '@drawable/ic_ui_info')
            elem.set(a('tint'), '@color/text_secondary')
            changed = True
    if changed:
        tree.write(path, encoding='utf-8', xml_declaration=True)


def patch_file_text(path: Path, replacements):
    text = path.read_text(encoding='utf-8')
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding='utf-8')


def ensure_import(text: str, imp: str) -> str:
    if imp in text:
        return text
    lines = text.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            insert_at = i + 1
    lines.insert(insert_at, imp)
    return '\n'.join(lines) + ('\n' if text.endswith('\n') else '')


def patch_kotlin():
    activity_files = [
        JAVA_DIR / 'activities/LoginActivity.kt',
        JAVA_DIR / 'activities/RegisterActivity.kt',
        JAVA_DIR / 'activities/ForgotPasswordActivity.kt',
        JAVA_DIR / 'activities/VerifyEmailActivity.kt',
        JAVA_DIR / 'activities/SplashActivity.kt',
        JAVA_DIR / 'activities/ReelsActivity.kt',
        JAVA_DIR / 'activities/ProfileActivity.kt',
        JAVA_DIR / 'activities/NotificationsActivity.kt',
        JAVA_DIR / 'activities/MainActivity.kt',
        JAVA_DIR / 'activities/LiveActivity.kt',
        JAVA_DIR / 'activities/GroupsListActivity.kt',
        JAVA_DIR / 'activities/GroupsActivity.kt',
        JAVA_DIR / 'activities/GroupChatActivity.kt',
        JAVA_DIR / 'activities/ChatActivity.kt',
        JAVA_DIR / 'activities/CallActivity.kt',
    ]
    for path in activity_files:
        text = path.read_text(encoding='utf-8')
        text = ensure_import(text, 'import com.socialapp.utils.UiKit')
        if 'UiKit.prepareScreen(this, binding.root)' not in text:
            text = text.replace('setContentView(binding.root)\n', 'setContentView(binding.root)\n        UiKit.prepareScreen(this, binding.root)\n', 1)
        path.write_text(text, encoding='utf-8')

    onboarding = JAVA_DIR / 'activities/OnboardingActivity.kt'
    text = onboarding.read_text(encoding='utf-8')
    text = ensure_import(text, 'import com.socialapp.utils.UiKit')
    if 'UiKit.prepareScreen(this, findViewById(android.R.id.content))' not in text:
        text = text.replace('setContentView(R.layout.activity_onboarding)\n', 'setContentView(R.layout.activity_onboarding)\n        UiKit.prepareScreen(this, findViewById(android.R.id.content))\n', 1)
    onboarding.write_text(text, encoding='utf-8')

    fragment_files = [
        JAVA_DIR / 'fragments/HomeFragment.kt',
        JAVA_DIR / 'fragments/NotificationsFragment.kt',
        JAVA_DIR / 'fragments/StoriesFragment.kt',
    ]
    for path in fragment_files:
        text = path.read_text(encoding='utf-8')
        text = ensure_import(text, 'import com.socialapp.utils.UiKit')
        if 'UiKit.prepareScreen(requireActivity(), binding.root)' not in text and 'onViewCreated' in text:
            text = text.replace('return binding.root\n', 'UiKit.prepareScreen(requireActivity(), binding.root)\n        return binding.root\n')
        path.write_text(text, encoding='utf-8')

    common_dialog_files = [
        JAVA_DIR / 'activities/GroupsListActivity.kt',
        JAVA_DIR / 'activities/ChatActivity.kt',
        JAVA_DIR / 'activities/GroupChatActivity.kt',
    ]
    for path in common_dialog_files:
        text = path.read_text(encoding='utf-8')
        text = text.replace('import androidx.appcompat.app.AlertDialog\n', '')
        text = ensure_import(text, 'import com.socialapp.utils.AppDialogs')
        text = text.replace('AlertDialog.Builder(this)', 'AppDialogs.builder(this)')
        text = text.replace('val input = android.widget.EditText(this).apply {', 'val input = AppDialogs.input(this).apply {')
        path.write_text(text, encoding='utf-8')

    # auth loading states
    replacements = {
        JAVA_DIR / 'activities/LoginActivity.kt': [
            ('binding.loginBtn.text = if (isLoading) "جاري الدخول..." else "تسجيل الدخول"\n        binding.registerBtn.text = "الانتقال إلى إنشاء حساب"\n', 'UiKit.setButtonLoading(binding.loginBtn, isLoading, "تسجيل الدخول", "جاري الدخول...")\n        binding.registerBtn.text = "إنشاء حساب جديد"\n')
        ],
        JAVA_DIR / 'activities/RegisterActivity.kt': [
            ('binding.registerBtn.text = if (isLoading) "جاري إنشاء الحساب..." else "إنشاء الحساب"\n        binding.loginBtn.text = "العودة إلى تسجيل الدخول"\n', 'UiKit.setButtonLoading(binding.registerBtn, isLoading, "إنشاء الحساب", "جاري إنشاء الحساب...")\n        binding.loginBtn.text = "العودة لتسجيل الدخول"\n')
        ],
        JAVA_DIR / 'activities/VerifyEmailActivity.kt': [
            ('binding.verifyBtn.text = if (isLoading) loadingText else "تأكيد البريد"\n', 'UiKit.setButtonLoading(binding.verifyBtn, isLoading, "تأكيد البريد", loadingText)\n')
        ],
        JAVA_DIR / 'activities/ForgotPasswordActivity.kt': [
            ('binding.sendCodeBtn.text = if (isLoading) "جاري إرسال الرمز..." else "إرسال رمز التحقق"\n', 'UiKit.setButtonLoading(binding.sendCodeBtn, isLoading, "إرسال رمز التحقق", "جاري إرسال الرمز...")\n'),
            ('binding.verifyCodeBtn.text = if (isLoading) "جاري التحقق..." else "تأكيد الرمز"\n', 'UiKit.setButtonLoading(binding.verifyCodeBtn, isLoading, "تأكيد الرمز", "جاري التحقق...")\n'),
            ('binding.savePasswordBtn.text = if (isLoading) "جاري حفظ كلمة المرور..." else "حفظ كلمة المرور الجديدة"\n', 'UiKit.setButtonLoading(binding.savePasswordBtn, isLoading, "حفظ كلمة المرور الجديدة", "جاري حفظ كلمة المرور...")\n'),
        ],
    }
    for path, reps in replacements.items():
        patch_file_text(path, reps)

    groups_path = JAVA_DIR / 'activities/GroupsListActivity.kt'
    groups_text = groups_path.read_text(encoding='utf-8')
    groups_text = groups_text.replace('binding.progressBar.visibility = android.view.View.VISIBLE', 'UiKit.setVisible(binding.progressBar, true)')
    groups_text = groups_text.replace('binding.progressBar.visibility = android.view.View.GONE', 'UiKit.setVisible(binding.progressBar, false)')
    groups_text = groups_text.replace('binding.emptyState.visibility = android.view.View.VISIBLE\n                    binding.groupsRecycler.visibility = android.view.View.GONE', 'UiKit.setVisible(binding.emptyState, true)\n                    UiKit.setVisible(binding.groupsRecycler, false)')
    groups_text = groups_text.replace('binding.emptyState.visibility = android.view.View.GONE\n                    binding.groupsRecycler.visibility = android.view.View.VISIBLE', 'UiKit.setVisible(binding.emptyState, false)\n                    UiKit.setVisible(binding.groupsRecycler, true)')
    groups_path.write_text(groups_text, encoding='utf-8')

    post_adapter = JAVA_DIR / 'adapters/PostAdapter.kt'
    text = post_adapter.read_text(encoding='utf-8')
    for old in [
        'import android.view.animation.Animation\n',
        'import android.view.animation.AnimationUtils\n',
        'import android.view.animation.ScaleAnimation\n',
    ]:
        text = text.replace(old, '')
    text = ensure_import(text, 'import com.socialapp.utils.UiKit')
    text = text.replace('        val anim = AnimationUtils.loadAnimation(holder.itemView.context, android.R.anim.fade_in)\n        holder.itemView.startAnimation(anim)\n', '        UiKit.animateListItem(holder.itemView)\n')
    text = text.replace('    private fun animateLike(view: android.view.View) {\n        val scale = ScaleAnimation(\n            1f, 1.15f, 1f, 1.15f,\n            Animation.RELATIVE_TO_SELF, 0.5f,\n            Animation.RELATIVE_TO_SELF, 0.5f\n        ).apply { duration = 180; repeatMode = android.view.animation.Animation.REVERSE; repeatCount = 1 }\n        view.startAnimation(scale)\n    }\n', '    private fun animateLike(view: android.view.View) {\n        view.animate().scaleX(1.12f).scaleY(1.12f).setDuration(110).withEndAction {\n            view.animate().scaleX(1f).scaleY(1f).setDuration(110).start()\n        }.start()\n    }\n')
    post_adapter.write_text(text, encoding='utf-8')


if __name__ == '__main__':
    for xml_path in sorted(LAYOUT_DIR.glob('*.xml')):
        patch_layout(xml_path)
    patch_kotlin()
    print('Applied mobile polish patches')
