package com.socialapp.subscriptions

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.socialapp.models.SubscriptionPlan
import com.socialapp.utils.AppLogger

class SubscriptionManager(
    context: Context,
    private val onPurchaseAcknowledged: (Purchase) -> Unit = {},
) : PurchasesUpdatedListener {
    private val billingClient = BillingClient.newBuilder(context.applicationContext)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    fun connect(onConnected: (() -> Unit)? = null) {
        if (billingClient.isReady) {
            onConnected?.invoke()
            return
        }
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    AppLogger.i("Billing", "Google Play Billing connected")
                    onConnected?.invoke()
                } else {
                    AppLogger.w("Billing", "Billing setup failed: ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                AppLogger.w("Billing", "Billing service disconnected")
            }
        })
    }

    fun querySubscriptionPlans(productIds: List<String>, onResult: (List<SubscriptionPlan>, List<ProductDetails>) -> Unit) {
        if (productIds.isEmpty()) {
            onResult(emptyList(), emptyList())
            return
        }
        connect {
            val products = productIds.map {
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(it)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            }
            val params = QueryProductDetailsParams.newBuilder().setProductList(products).build()
            billingClient.queryProductDetailsAsync(params) { billingResult, details ->
                if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                    AppLogger.w("Billing", "Query product details failed: ${billingResult.debugMessage}")
                    onResult(emptyList(), emptyList())
                    return@queryProductDetailsAsync
                }
                val plans = details.map { detail ->
                    val pricing = detail.subscriptionOfferDetails?.firstOrNull()?.pricingPhases?.pricingPhaseList?.firstOrNull()
                    SubscriptionPlan(
                        productId = detail.productId,
                        title = detail.name,
                        priceDisplay = pricing?.formattedPrice ?: "—",
                        billingPeriod = pricing?.billingPeriod ?: "P1M",
                        features = listOf(detail.description).filter { it.isNotBlank() },
                        isRecommended = detail.productId.contains("pro", ignoreCase = true),
                    )
                }
                onResult(plans, details)
            }
        }
    }

    fun launchSubscriptionPurchase(activity: Activity, productDetails: ProductDetails) {
        val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken ?: return
        val params = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .setOfferToken(offerToken)
            .build()
        val billingFlow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(params))
            .build()
        billingClient.launchBillingFlow(activity, billingFlow)
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            AppLogger.w("Billing", "Purchase update failed: ${billingResult.debugMessage}")
            return
        }
        purchases.orEmpty().forEach { purchase ->
            if (!purchase.isAcknowledged) {
                val params = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
                billingClient.acknowledgePurchase(params) { ackResult ->
                    if (ackResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        onPurchaseAcknowledged(purchase)
                    }
                }
            } else {
                onPurchaseAcknowledged(purchase)
            }
        }
    }

    fun release() {
        billingClient.endConnection()
    }
}
