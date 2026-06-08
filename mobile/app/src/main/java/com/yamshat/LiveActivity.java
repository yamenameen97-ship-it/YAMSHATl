package com.yamshat;

import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class LiveActivity extends AppCompatActivity {

    private TextView timeDisplay;
    private TextView broadcasterName;
    private TextView broadcasterHandle;
    private MaterialButton followButton;
    private MaterialButton exploreButton;
    private ImageView likeButton;
    private ImageView commentButton;
    private ImageView giftButton;
    private ImageView shareButton;
    private ImageView profileButton;
    private ImageView closeButton;
    private EditText commentInput;
    private MaterialCardView broadcasterAvatar;
    private MaterialCardView videoContainer;

    private boolean isLiked = false;
    private int likeCount = 25700;
    private int commentCount = 1245;
    private int shareCount = 1026;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_live);

        initializeViews();
        setupListeners();
        updateTimeDisplay();
        startTimeUpdater();
    }

    private void initializeViews() {
        timeDisplay = findViewById(R.id.timeDisplay);
        broadcasterName = findViewById(R.id.broadcasterName);
        broadcasterHandle = findViewById(R.id.broadcasterHandle);
        followButton = findViewById(R.id.followButton);
        exploreButton = findViewById(R.id.exploreButton);
        likeButton = findViewById(R.id.likeButton);
        commentButton = findViewById(R.id.commentButton);
        giftButton = findViewById(R.id.giftButton);
        shareButton = findViewById(R.id.shareButton);
        profileButton = findViewById(R.id.profileButton);
        closeButton = findViewById(R.id.closeButton);
        commentInput = findViewById(R.id.commentInput);
        broadcasterAvatar = findViewById(R.id.broadcasterAvatar);
        videoContainer = findViewById(R.id.videoContainer);
    }

    private void setupListeners() {
        // زر المتابعة
        followButton.setOnClickListener(v -> handleFollowClick());

        // زر الاستكشاف
        exploreButton.setOnClickListener(v -> handleExploreClick());

        // زر الإعجاب
        likeButton.setOnClickListener(v -> handleLikeClick());

        // زر التعليقات
        commentButton.setOnClickListener(v -> handleCommentClick());

        // زر الهدايا
        giftButton.setOnClickListener(v -> handleGiftClick());

        // زر المشاركة
        shareButton.setOnClickListener(v -> handleShareClick());

        // زر الملف الشخصي
        profileButton.setOnClickListener(v -> handleProfileClick());

        // زر الإغلاق
        closeButton.setOnClickListener(v -> finish());
    }

    private void handleFollowClick() {
        if (followButton.getText().toString().contains("متابعة")) {
            followButton.setText("متابع ✓");
            followButton.setBackgroundColor(getResources().getColor(R.color.primary));
        } else {
            followButton.setText("متابعة +");
            followButton.setBackgroundColor(getResources().getColor(R.color.like));
        }
    }

    private void handleExploreClick() {
        // فتح صفحة الاستكشاف
        // TODO: تطبيق الملاحة
    }

    private void handleLikeClick() {
        if (!isLiked) {
            isLiked = true;
            likeCount++;
            likeButton.setColorFilter(getResources().getColor(R.color.like));
        } else {
            isLiked = false;
            likeCount--;
            likeButton.setColorFilter(getResources().getColor(R.color.white));
        }
        updateLikeCount();
    }

    private void handleCommentClick() {
        commentInput.requestFocus();
    }

    private void handleGiftClick() {
        // فتح نافذة الهدايا
        // TODO: تطبيق نافذة الهدايا
    }

    private void handleShareClick() {
        // مشاركة البث
        // TODO: تطبيق المشاركة
    }

    private void handleProfileClick() {
        // فتح الملف الشخصي للمذيع
        // TODO: تطبيق الملاحة
    }

    private void updateTimeDisplay() {
        SimpleDateFormat sdf = new SimpleDateFormat("h:mm", Locale.getDefault());
        timeDisplay.setText(sdf.format(new Date()));
    }

    private void updateLikeCount() {
        // تحديث عدد الإعجابات
        // TODO: تحديث واجهة المستخدم
    }

    private void startTimeUpdater() {
        new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(60000); // تحديث كل دقيقة
                    runOnUiThread(this::updateTimeDisplay);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }
}
