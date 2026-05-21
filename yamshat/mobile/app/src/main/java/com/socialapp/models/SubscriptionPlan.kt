package com.socialapp.models

data class SubscriptionPlan(
    val productId: String,
    val title: String,
    val priceDisplay: String,
    val billingPeriod: String,
    val features: List<String> = emptyList(),
    val isRecommended: Boolean = false,
)
