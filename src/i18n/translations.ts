export const translationResources = {
  en: {
    language: {
      switcherLabel: "Language",
      ariaLabel: "Change language",
      english: "English",
      turkish: "Turkish",
    },
    common: {
      appName: "Fakestore",
      actions: {
        cancel: "Cancel",
        close: "Close",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        retry: "Try again",
      },
    },
    cart: {
      quantity: {
        label: "Quantity",
        increase: "Increase quantity",
        decrease: "Decrease quantity",
      },
      title: "Your Cart",
      subtitle: "Review the items you've added before checking out.",
      loading: "Loading your cart...",
      reloadErrorTitle: "We couldn't load your cart",
      reloadErrorFallback: "Something went wrong while loading your cart.",
      reloadErrorRetry: "Failed to reload your cart.",
      retrying: "Retrying…",
      empty: {
        title: "Your cart is empty",
        description: "Browse products and add items to see them appear here.",
        hint: "When you add items from the catalog they'll show up here.",
      },
      banners: {
        refreshing: "Refreshing cart…",
        applying: "Applying your changes…",
      },
      item: {
        removeSuccess: "Removed item from cart.",
        removeError: "Failed to remove item from cart.",
        updateSuccess: "Updated cart quantity.",
        updateError: "Failed to update quantity.",
        removeAria: 'Remove "{{product}}" from cart',
      },
      summary: {
        title: "Order summary",
        description: "You have {{count}} {{items}} in your cart.",
        itemSingular: "item",
        itemPlural: "items",
        subtotal: "Subtotal",
        shipping: "Shipping",
        shippingNote: "Calculated at checkout",
        total: "Total",
        placeOrder: "Place order",
        disabledHint: "Order placement will be available once checkout is ready.",
        orderUnavailable: "Ordering isn’t available yet. Please check back soon!",
      },
      messages: {
        accessRequired: "You need to be signed in to access the cart.",
        updateRequired: "You need to be signed in to update the cart.",
        notFound: "Unable to locate your cart.",
        missingChanges: "No cart changes were provided.",
        updateFailed: "Failed to update cart. Please try again.",
        validationFailed: "We couldn’t apply those cart changes. Please review and try again.",
        itemMissing: "The selected item is not in your cart.",
        quantityInvalid: "Quantity must be a valid number.",
      },
    },
    auth: {
      passwordInput: {
        show: "Show password",
        hide: "Hide password",
      },
      username: {
        label: "Username",
        placeholder: "Enter your username",
        status: {
          checking: "Checking availability...",
          available: "Username available",
          unavailable: "Username is already taken",
          error: "We couldn't verify that username right now.",
        },
      },
      login: {
        title: "Welcome back",
        description: "Sign in with your store credentials to continue.",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        alertTitle: "Unable to sign in",
        alertHint:
          "If you forgot your password, try resetting it or contact support for help.",
        button: "Sign in",
        registerPrompt: "Need an account?",
        registerLink: "Create one",
      },
      register: {
        title: "Create an account",
        description: "Join Fakestore to manage your profile, cart, and more.",
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        usernamePlaceholder: "Choose a unique username",
        password: "Password",
        passwordHint:
          "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.",
        button: "Create account",
        buttonLoading: "Creating account...",
        redirectHint: "Already have an account?",
        signInLink: "Sign in",
      },
      alerts: {
        signUpFailed: "Sign-up failed",
      },
      messages: {
        invalidCredentials:
          "We couldn’t sign you in with those details. Please try again.",
        throttled:
          "Too many sign-in attempts. Please wait a moment and try again.",
        loginGeneric:
          "We ran into a problem while signing you in. Please try again in a few moments.",
        loginUnexpected:
          "We ran into an unexpected issue while signing you in. Please try again.",
        loadProfileFailed:
          "Unable to load your account details after signing in.",
        registerValidation:
          "We couldn’t create your account with those details. Please review the form and try again.",
        registerGeneric:
          "We ran into a problem while creating your account. Please try again in a few moments.",
        registerAutoLogin:
          "Your account was created, but we couldn’t sign you in automatically. Try logging in manually.",
      },
      passwordChecks: {
        length: "At least 6 characters",
        uppercase: "Contains an uppercase letter (A-Z)",
        lowercase: "Contains a lowercase letter (a-z)",
        number: "Contains a number (0-9)",
        special: "Contains a special character (!@#$%^&*)",
      },
    },
    routing: {
      checkingSession: "Checking session...",
    },
    navigation: {
      products: "Products",
      cart: "Cart",
      profile: "Profile",
      signIn: "Sign in",
      signOut: "Log out",
      accountFallback: "Account",
      menuLabel: "Navigate",
      openMenu: "Open navigation menu",
    },
    products: {
      header: {
        title: "Products",
        description: "Discover curated picks from our Fakestore catalog.",
        loadingCategories: "Loading categories...",
        allCategories: "All categories",
      },
      actions: {
        addToCart: "Add to cart",
        updatingCart: "Updating cart...",
      },
      grid: {
        empty: "No products found for the selected filters.",
        ratingUnavailable: "Rating unavailable",
        ratedLabel: "Rated {{rating}}",
        reviewsLabel: "{{count}} reviews",
      },
      summary: {
        updating: "Updating products…",
        showing: "Showing {{first}}–{{last}} of {{total}} {{label}}",
        genericLabel: "products",
        categoryLabel: "{{category}} products",
      },
      toasts: {
        signInRequired: "Sign in to add items to your cart.",
        addToCartSuccess: 'Added "{{product}}" to your cart.',
        addToCartWithQuantity: 'Added {{count}} of "{{product}}" to your cart.',
        addToCartError: "We couldn't add that product to your cart.",
        signInAction: "Sign in",
      },
    },
    productDetail: {
      backToProducts: "← Back to products",
      missingId: "Product identifier is missing.",
      loading: "Loading product details...",
      notFound: "Product not found.",
      toasts: {
        signInToRate: "Sign in to rate this product.",
      },
      overview: {
        noCategories: "No categories assigned",
        ratingSummary: "{{rating}} average · {{count}} {{label}}",
        ratingLabelSingular: "rating",
        ratingLabelPlural: "ratings",
        ratingUnavailable: "No ratings yet",
      },
      ratings: {
        title: "What shoppers are saying",
        noRatings: "No ratings yet. Be the first to leave a rating.",
        summaryEmpty: "No ratings yet",
        summaryCount: "{{count}} {{label}}",
        summaryPrompt: "Be the first to rate",
        signInPrompt: "Sign in to rate this product.",
        yourRating: "Your rating",
        removing: "Removing your rating...",
        youRatedValue: "You rated this product {{value}} star{{suffix}}.",
        youRated: "You rated this product.",
        selectPrompt: "Select a star rating.",
        remove: "Remove rating",
        removingShort: "Removing...",
        loading: "Loading ratings...",
        loadError: "Unable to load ratings right now.",
        anonymous: "Anonymous shopper",
        rateAria: "Rate {{value}} star{{suffix}}",
        thanks: "Thanks for rating this product {{value}} star{{suffix}}.",
        saveError: "We couldn't save your rating. Please try again.",
        removeError: "We couldn't remove your rating. Please try again.",
        removeSuccess: "Your rating was removed.",
        permissionError: "You do not have permission to rate this product.",
        authError: "You need to sign in again to rate this product.",
        notFound: "We couldn't find that rating to remove.",
        localNotFound: "We couldn't find your rating to remove. Please refresh and try again.",
      },
    },
    profile: {
      title: "Profile",
      subtitle: "Manage your personal information and account preferences.",
      unavailable: {
        title: "Profile unavailable",
        description:
          "We couldn't load your profile details. Please sign in again to continue.",
        action: "Go to sign in",
      },
      messages: {
        requestFailed:
          "We couldn't complete that request right now. Please try again.",
        profileMissing:
          "We couldn't find your profile. Please sign in again.",
      },
      toasts: {
        profileUpdated: "Profile updated successfully.",
        addressAdded: "Address added successfully.",
        addressUpdated: "Address updated successfully.",
        addressRemoved: "Address removed successfully.",
        addressRemoveError:
          "We couldn't remove that address right now. Please try again.",
        passwordUpdated: "Password updated successfully.",
        accountDeleted: "Your account has been deleted.",
        accountDeleteError:
          "We couldn't delete your account right now. Please try again.",
      },
      summary: {
        description: "Account details from your Fakestore profile.",
        contactSection: "Contact",
        phoneMissing: "Phone not provided",
        accountSection: "Account",
        usernameLabel: "Username",
        memberSince: "Member since",
        lastLogin: "Last login",
        editButton: "Edit profile",
      },
      addresses: {
        title: "Addresses",
        description:
          "Manage the delivery addresses linked to your account.",
        addButton: "Add address",
        empty: "You haven't saved any addresses yet.",
        coordinatesLabel: "Coordinates",
        coordinatesValue: "Coordinates: {{lat}}, {{long}}",
        edit: "Edit",
        remove: "Remove",
        deleteDialogTitle: "Remove this address?",
        deleteDialogDescription:
          "We'll remove {{street}} {{number}} from your saved addresses. You can add it again at any time.",
        deleteErrorTitle: "Address removal failed",
        removeAria: 'Remove address at {{street}} {{number}}',
        cancel: "Cancel",
        confirm: "Remove",
      },
      security: {
        title: "Security",
        description:
          "Update sensitive account information such as your password.",
        body: "Choose a strong password to keep your account secure.",
        button: "Change password",
      },
      delete: {
        title: "Delete account",
        description:
          "Permanently remove your Fakestore account and all associated data.",
        alertTitle: "Account deletion failed",
        dialogTitle: "Delete your account?",
        dialogDescription:
          "This action cannot be undone. All of your profile information, addresses, and saved data will be permanently removed.",
        button: "Delete account",
        deleting: "Deleting...",
        cancel: "Cancel",
      },
      dialogs: {
        profile: {
          title: "Edit profile",
          description:
            "Update your personal details. Some changes may require you to sign in again.",
          alertTitle: "Profile update failed",
          save: "Save changes",
          saving: "Saving...",
        },
        address: {
          addTitle: "Add new address",
          editTitle: "Edit address",
          description:
            "Provide the full address details. All fields are required.",
          alertTitle: "Address update failed",
          saveAdd: "Add address",
          saveEdit: "Update address",
          saving: "Saving...",
        },
        password: {
          title: "Change password",
          description:
            "Choose a strong password that meets all requirements.",
          alertTitle: "Password update failed",
          newPassword: "New password",
          confirmPassword: "Confirm password",
          save: "Update password",
          saving: "Saving...",
        },
      },
      fields: {
        phone: "Phone",
        street: "Street",
        number: "Number",
        city: "City",
        zipcode: "ZIP code",
        latitude: "Latitude",
        longitude: "Longitude",
      },
    },
    validation: {
      usernameRequired: "Username is required",
      usernamePattern: "Username can only contain letters and numbers",
      usernameMinLength: "Username must be at least {{min}} characters",
      passwordRequired: "Password is required",
      passwordRequirement:
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.",
      emailRequired: "Email is required",
      emailInvalid: "Enter a valid email address",
      firstNameRequired: "First name is required",
      lastNameRequired: "Last name is required",
      streetRequired: "Street is required.",
      streetNumberRequired: "Street number is required.",
      streetNumberNumeric: "Street number must be numeric.",
      streetNumberPositive: "Street number must be greater than 0.",
      cityRequired: "City is required.",
      zipRequired: "ZIP code is required.",
      latitudeRequired: "Latitude is required.",
      longitudeRequired: "Longitude is required.",
      confirmPasswordRequired: "Please confirm your new password.",
      passwordsMustMatch: "Passwords must match.",
    },
    notFound: {
      badge: "404 error",
      title: "Page not found",
      description:
        "We couldn't find the page you were looking for. It may have been moved or deleted.",
      action: "Return home",
    },
  },
  tr: {
    language: {
      switcherLabel: "Dil",
      ariaLabel: "Dili değiştir",
      english: "İngilizce",
      turkish: "Türkçe",
    },
    common: {
      appName: "Fakestore",
      actions: {
        cancel: "Vazgeç",
        close: "Kapat",
        save: "Kaydet",
        edit: "Düzenle",
        delete: "Sil",
        retry: "Tekrar dene",
      },
    },
    cart: {
      quantity: {
        label: "Adet",
        increase: "Adedi artır",
        decrease: "Adedi azalt",
      },
      title: "Sepetiniz",
      subtitle: "Ödeme yapmadan önce eklediğiniz ürünleri gözden geçirin.",
      loading: "Sepetiniz yükleniyor...",
      reloadErrorTitle: "Sepetiniz yüklenemedi",
      reloadErrorFallback: "Sepet yüklenirken bir sorun oluştu.",
      reloadErrorRetry: "Sepet tekrar yüklenemedi.",
      retrying: "Tekrar deneniyor…",
      empty: {
        title: "Sepetiniz boş",
        description: "Ürünlere göz atın ve görmek için sepetinize ekleyin.",
        hint: "Katalogdan ürün eklediğinizde burada görünecek.",
      },
      banners: {
        refreshing: "Sepet yenileniyor…",
        applying: "Değişiklikler uygulanıyor…",
      },
      item: {
        removeSuccess: "Ürün sepetten kaldırıldı.",
        removeError: "Ürünü sepetten kaldırırken hata oluştu.",
        updateSuccess: "Sepet adedi güncellendi.",
        updateError: "Adedi güncelleyemedik.",
        removeAria: '"{{product}}" ürününü sepetten kaldır',
      },
      summary: {
        title: "Sipariş özeti",
        description: "Sepetinizde {{count}} {{items}} var.",
        itemSingular: "ürün",
        itemPlural: "ürün",
        subtotal: "Ara toplam",
        shipping: "Kargo",
        shippingNote: "Ödeme sırasında hesaplanır",
        total: "Toplam",
        placeOrder: "Sipariş ver",
        disabledHint: "Ödeme hazır olduğunda sipariş verebileceksiniz.",
        orderUnavailable: "Sipariş vermek için biraz daha bekleyin!",
      },
      messages: {
        accessRequired: "Sepete erişmek için giriş yapmalısınız.",
        updateRequired: "Sepeti güncellemek için giriş yapmalısınız.",
        notFound: "Sepetiniz bulunamadı.",
        missingChanges: "Sepet değişiklikleri belirtilmedi.",
        updateFailed: "Sepet güncellenemedi. Lütfen tekrar deneyin.",
        validationFailed: "Sepet değişiklikleri uygulanamadı. Lütfen kontrol edin.",
        itemMissing: "Seçilen ürün sepetinizde değil.",
        quantityInvalid: "Adet geçerli bir sayı olmalı.",
      },
    },
    auth: {
      passwordInput: {
        show: "Şifreyi göster",
        hide: "Şifreyi gizle",
      },
      username: {
        label: "Kullanıcı adı",
        placeholder: "Kullanıcı adınızı girin",
        status: {
          checking: "Uygunluk kontrol ediliyor...",
          available: "Kullanıcı adı uygun",
          unavailable: "Bu kullanıcı adı zaten alınmış",
          error: "Şu anda kullanıcı adını doğrulayamadık.",
        },
      },
      login: {
        title: "Tekrar hoş geldiniz",
        description: "Devam etmek için mağaza bilgilerinle giriş yap.",
        passwordLabel: "Şifre",
        passwordPlaceholder: "Şifrenizi girin",
        alertTitle: "Giriş yapılamadı",
        alertHint:
          "Şifrenizi unuttuysanız sıfırlamayı deneyin veya destekle iletişime geçin.",
        button: "Giriş yap",
        registerPrompt: "Hesabın mı yok?",
        registerLink: "Hemen oluştur",
      },
      register: {
        title: "Hesap oluştur",
        description: "Profilinizi, sepetinizi ve daha fazlasını yönetmek için katılın.",
        firstName: "Ad",
        lastName: "Soyad",
        email: "E-posta",
        usernamePlaceholder: "Benzersiz bir kullanıcı adı seçin",
        password: "Şifre",
        passwordHint:
          "Şifre en az 6 karakter olmalı ve büyük/küçük harf, sayı ve özel karakter içermelidir.",
        button: "Hesap oluştur",
        buttonLoading: "Hesap oluşturuluyor...",
        redirectHint: "Zaten bir hesabın var mı?",
        signInLink: "Giriş yap",
      },
      alerts: {
        signUpFailed: "Kayıt başarısız",
      },
      messages: {
        invalidCredentials:
          "Bu bilgilerle giriş yapamadık. Lütfen tekrar deneyin.",
        throttled:
          "Çok fazla giriş denemesi. Lütfen biraz bekleyip tekrar deneyin.",
        loginGeneric:
          "Giriş yaparken bir sorun oluştu. Lütfen kısa süre sonra tekrar deneyin.",
        loginUnexpected:
          "Giriş yaparken beklenmedik bir sorun oluştu. Lütfen tekrar deneyin.",
        loadProfileFailed:
          "Girişten sonra hesap bilgilerinizi yükleyemedik.",
        registerValidation:
          "Bu bilgilerle hesabınızı oluşturamadık. Lütfen formu kontrol edin.",
        registerGeneric:
          "Hesabınızı oluştururken bir sorun yaşadık. Lütfen tekrar deneyin.",
        registerAutoLogin:
          "Hesabınız oluşturuldu ancak otomatik giriş yapılamadı. Lütfen manuel giriş yapın.",
      },
      passwordChecks: {
        length: "En az 6 karakter",
        uppercase: "Büyük harf içermeli (A-Z)",
        lowercase: "Küçük harf içermeli (a-z)",
        number: "Sayı içermeli (0-9)",
        special: "Özel karakter içermeli (!@#$%^&*)",
      },
    },
    routing: {
      checkingSession: "Oturum kontrol ediliyor...",
    },
    navigation: {
      products: "Ürünler",
      cart: "Sepet",
      profile: "Profil",
      signIn: "Giriş yap",
      signOut: "Çıkış yap",
      accountFallback: "Hesap",
      menuLabel: "Gezinti",
      openMenu: "Gezinme menüsünü aç",
    },
    products: {
      header: {
        title: "Ürünler",
        description: "Fakestore kataloğumuzdaki seçkileri keşfedin.",
        loadingCategories: "Kategoriler yükleniyor...",
        allCategories: "Tüm kategoriler",
      },
      actions: {
        addToCart: "Sepete ekle",
        updatingCart: "Sepet güncelleniyor...",
      },
      grid: {
        empty: "Seçili filtreler için ürün bulunamadı.",
        ratingUnavailable: "Puan bilgisi yok",
        ratedLabel: "{{rating}} puanlandı",
        reviewsLabel: "{{count}} değerlendirme",
      },
      summary: {
        updating: "Ürünler güncelleniyor…",
        showing: "{{first}}–{{last}} / {{total}} {{label}} gösteriliyor",
        genericLabel: "ürün",
        categoryLabel: "{{category}} ürün",
      },
      toasts: {
        signInRequired: "Sepete ürün eklemek için giriş yapın.",
        addToCartSuccess: '"{{product}}" sepetinize eklendi.',
        addToCartWithQuantity: '{{count}} adet "{{product}}" sepetinize eklendi.',
        addToCartError: "Bu ürünü sepetinize ekleyemedik.",
        signInAction: "Giriş yap",
      },
    },
    productDetail: {
      backToProducts: "← Ürünlere dön",
      missingId: "Ürün kimliği eksik.",
      loading: "Ürün detayları yükleniyor...",
      notFound: "Ürün bulunamadı.",
      toasts: {
        signInToRate: "Bu ürüne puan vermek için giriş yapın.",
      },
      overview: {
        noCategories: "Kategori atanmadı",
        ratingSummary: "{{rating}} ortalama · {{count}} {{label}}",
        ratingLabelSingular: "oy",
        ratingLabelPlural: "oy",
        ratingUnavailable: "Henüz puan yok",
      },
      ratings: {
        title: "Alıcılar ne diyor",
        noRatings: "Henüz değerlendirme yok. İlk değerlendirmeyi siz yapın.",
        summaryEmpty: "Henüz puan yok",
        summaryCount: "{{count}} {{label}}",
        summaryPrompt: "İlk puanı siz verin",
        signInPrompt: "Bu ürünü puanlamak için giriş yapın.",
        yourRating: "Puanınız",
        removing: "Puanınız kaldırılıyor...",
        youRatedValue: 'Bu ürünü {{value}} yıldız olarak puanladınız.',
        youRated: "Bu ürünü puanladınız.",
        selectPrompt: "Bir yıldız değeri seçin.",
        remove: "Puanı kaldır",
        removingShort: "Kaldırılıyor...",
        loading: "Puanlar yükleniyor...",
        loadError: "Puanlar şu anda yüklenemiyor.",
        anonymous: "Anonim müşteri",
        rateAria: "{{value}} yıldız ver",
        thanks: "Bu ürüne {{value}} yıldız verdiğiniz için teşekkürler.",
        saveError: "Puanınızı kaydedemedik. Lütfen tekrar deneyin.",
        removeError: "Puanınızı kaldıramadık. Lütfen tekrar deneyin.",
        removeSuccess: "Puanınız kaldırıldı.",
        permissionError: "Bu ürünü puanlama izniniz yok.",
        authError: "Bu ürünü puanlamak için yeniden giriş yapmanız gerekiyor.",
        notFound: "Kaldırılacak puan bulunamadı.",
        localNotFound: "Kaldırılacak puanınızı bulamadık. Lütfen yenileyip tekrar deneyin.",
      },
    },
    profile: {
      title: "Profil",
      subtitle: "Kişisel bilgilerinizi ve hesap tercihlerinizi yönetin.",
      unavailable: {
        title: "Profil kullanılamıyor",
        description:
          "Profil bilgilerinizi yükleyemedik. Devam etmek için lütfen yeniden giriş yapın.",
        action: "Giriş sayfasına git",
      },
      messages: {
        requestFailed:
          "Bu isteği şu anda tamamlayamadık. Lütfen tekrar deneyin.",
        profileMissing:
          "Profilinizi bulamadık. Lütfen yeniden giriş yapın.",
      },
      toasts: {
        profileUpdated: "Profil başarıyla güncellendi.",
        addressAdded: "Adres başarıyla eklendi.",
        addressUpdated: "Adres başarıyla güncellendi.",
        addressRemoved: "Adres başarıyla kaldırıldı.",
        addressRemoveError:
          "Bu adresi şu anda kaldıramadık. Lütfen tekrar deneyin.",
        passwordUpdated: "Şifre başarıyla güncellendi.",
        accountDeleted: "Hesabınız silindi.",
        accountDeleteError:
          "Hesabınızı şu anda silemedik. Lütfen tekrar deneyin.",
      },
      summary: {
        description: "Fakestore profilinizden hesap detayları.",
        contactSection: "İletişim",
        phoneMissing: "Telefon belirtilmedi",
        accountSection: "Hesap",
        usernameLabel: "Kullanıcı adı",
        memberSince: "Üyelik tarihi",
        lastLogin: "Son giriş",
        editButton: "Profili düzenle",
      },
      addresses: {
        title: "Adresler",
        description:
          "Hesabınıza bağlı teslimat adreslerini yönetin.",
        addButton: "Adres ekle",
        empty: "Henüz kaydedilmiş adresiniz yok.",
        coordinatesLabel: "Koordinatlar",
        coordinatesValue: "Koordinatlar: {{lat}}, {{long}}",
        edit: "Düzenle",
        remove: "Kaldır",
        deleteDialogTitle: "Bu adres kaldırılsın mı?",
        deleteDialogDescription:
          "{{street}} {{number}} adresini kayıtlı adreslerinizden kaldıracağız. Dilediğiniz zaman yeniden ekleyebilirsiniz.",
        deleteErrorTitle: "Adres kaldırılamadı",
        removeAria: "{{street}} {{number}} adresini kaldır",
        cancel: "Vazgeç",
        confirm: "Kaldır",
      },
      security: {
        title: "Güvenlik",
        description:
          "Şifreniz gibi hassas hesap bilgilerini güncelleyin.",
        body: "Hesabınızı korumak için güçlü bir şifre seçin.",
        button: "Şifreyi değiştir",
      },
      delete: {
        title: "Hesabı sil",
        description:
          "Fakestore hesabınızı ve tüm verilerinizi kalıcı olarak silin.",
        alertTitle: "Hesap silme başarısız",
        dialogTitle: "Hesabınızı silmek istiyor musunuz?",
        dialogDescription:
          "Bu işlem geri alınamaz. Tüm profil bilgileriniz, adresleriniz ve kayıtlı verileriniz kalıcı olarak silinecek.",
        button: "Hesabı sil",
        deleting: "Siliniyor...",
        cancel: "Vazgeç",
      },
      dialogs: {
        profile: {
          title: "Profili düzenle",
          description:
            "Kişisel bilgilerinizi güncelleyin. Bazı değişiklikler yeniden giriş yapmanızı gerektirebilir.",
          alertTitle: "Profil güncellenemedi",
          save: "Değişiklikleri kaydet",
          saving: "Kaydediliyor...",
        },
        address: {
          addTitle: "Yeni adres ekle",
          editTitle: "Adresi düzenle",
          description: "Tüm adres bilgilerini eksiksiz girin.",
          alertTitle: "Adres güncellenemedi",
          saveAdd: "Adres ekle",
          saveEdit: "Adresi güncelle",
          saving: "Kaydediliyor...",
        },
        password: {
          title: "Şifreyi değiştir",
          description:
            "Tüm gereksinimleri karşılayan güçlü bir şifre seçin.",
          alertTitle: "Şifre güncellenemedi",
          newPassword: "Yeni şifre",
          confirmPassword: "Şifreyi doğrula",
          save: "Şifreyi güncelle",
          saving: "Kaydediliyor...",
        },
      },
      fields: {
        phone: "Telefon",
        street: "Sokak",
        number: "Numara",
        city: "Şehir",
        zipcode: "Posta kodu",
        latitude: "Enlem",
        longitude: "Boylam",
      },
    },
    validation: {
      usernameRequired: "Kullanıcı adı zorunludur",
      usernamePattern: "Kullanıcı adı yalnızca harf ve rakam içerebilir",
      usernameMinLength: "Kullanıcı adı en az {{min}} karakter olmalı",
      passwordRequired: "Şifre zorunludur",
      passwordRequirement:
        "Şifre en az 6 karakter olmalı ve büyük/küçük harf, sayı ve özel karakter içermelidir.",
      emailRequired: "E-posta zorunludur",
      emailInvalid: "Geçerli bir e-posta adresi girin",
      firstNameRequired: "Ad zorunludur",
      lastNameRequired: "Soyad zorunludur",
      streetRequired: "Sokak alanı zorunludur.",
      streetNumberRequired: "Sokak numarası zorunludur.",
      streetNumberNumeric: "Sokak numarası sayısal olmalıdır.",
      streetNumberPositive: "Sokak numarası 0'dan büyük olmalıdır.",
      cityRequired: "Şehir zorunludur.",
      zipRequired: "Posta kodu zorunludur.",
      latitudeRequired: "Enlem zorunludur.",
      longitudeRequired: "Boylam zorunludur.",
      confirmPasswordRequired: "Lütfen yeni şifrenizi doğrulayın.",
      passwordsMustMatch: "Şifreler eşleşmelidir.",
    },
    notFound: {
      badge: "404 hatası",
      title: "Sayfa bulunamadı",
      description:
        "Aradığınız sayfayı bulamadık. Taşınmış veya silinmiş olabilir.",
      action: "Ana sayfaya dön",
    },
  },
} as const

export type TranslationResources = typeof translationResources
export type Language = keyof TranslationResources

export const fallbackLanguage: Language = "en"

export const languageMetadata: Record<
  Language,
  {
    label: string
    locale: string
  }
> = {
  en: {
    label: translationResources.en.language.english,
    locale: "en-US",
  },
  tr: {
    label: translationResources.tr.language.turkish,
    locale: "tr-TR",
  },
}

export const supportedLanguages = Object.keys(
  translationResources,
) as Language[]
