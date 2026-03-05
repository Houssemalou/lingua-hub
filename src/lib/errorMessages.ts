// ============================================
// Centralized Error Message Mapper
// Converts raw backend error strings to user-friendly messages (FR / AR)
// ============================================

interface ErrorMapping {
  /** Regex or plain substring matched against the raw backend message (case-insensitive) */
  pattern: RegExp;
  fr: string;
  ar: string;
}

// Order matters: first match wins. Put more specific patterns first.
const ERROR_MAPPINGS: ErrorMapping[] = [
  // ── Authentication ──────────────────────────────────────────────
  {
    pattern: /invalid email or password/i,
    fr: 'Email ou mot de passe incorrect.',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  },
  {
    pattern: /invalid.*credentials/i,
    fr: 'Identifiants invalides.',
    ar: 'بيانات الاعتماد غير صالحة.',
  },
  {
    pattern: /authentication failed/i,
    fr: 'Session expirée. Veuillez vous reconnecter.',
    ar: 'انتهت الجلسة. يرجى إعادة تسجيل الدخول.',
  },
  {
    pattern: /access denied/i,
    fr: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
    ar: 'تم رفض الوصول. ليس لديك الصلاحيات اللازمة.',
  },
  {
    pattern: /invalid or expired access token/i,
    fr: "Token d'accès invalide ou expiré.",
    ar: 'رمز الوصول غير صالح أو منتهي الصلاحية.',
  },
  {
    pattern: /invalid access token/i,
    fr: "Token d'accès invalide.",
    ar: 'رمز الوصول غير صالح.',
  },
  {
    pattern: /invalid refresh token/i,
    fr: 'Session expirée. Veuillez vous reconnecter.',
    ar: 'انتهت الجلسة. يرجى إعادة تسجيل الدخول.',
  },
  {
    pattern: /refresh token is required/i,
    fr: 'Session expirée. Veuillez vous reconnecter.',
    ar: 'انتهت الجلسة. يرجى إعادة تسجيل الدخول.',
  },
  {
    pattern: /token is required/i,
    fr: 'Le token est requis.',
    ar: 'الرمز مطلوب.',
  },
  {
    pattern: /token.*expiré|expired.*token/i,
    fr: "Votre token a expiré. Veuillez contacter l'administrateur.",
    ar: 'انتهت صلاحية الرمز. يرجى التواصل مع المسؤول.',
  },
  {
    pattern: /votre token d'accès a expiré/i,
    fr: "Votre token d'accès a expiré. Veuillez contacter l'administrateur pour obtenir un nouveau token.",
    ar: 'انتهت صلاحية رمز الوصول الخاص بك. يرجى التواصل مع المسؤول للحصول على رمز جديد.',
  },
  {
    pattern: /votre compte est inactif/i,
    fr: "Votre compte est inactif. Veuillez contacter l'administrateur.",
    ar: 'حسابك غير نشط. يرجى التواصل مع المسؤول.',
  },
  {
    pattern: /vérifier votre adresse email/i,
    fr: 'Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception.',
    ar: 'يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول. راجع صندوق الوارد.',
  },
  {
    pattern: /email already verified/i,
    fr: 'Cet email est déjà vérifié.',
    ar: 'هذا البريد الإلكتروني تم التحقق منه بالفعل.',
  },
  {
    pattern: /invalid verification token|invalid or expired verification token/i,
    fr: 'Lien de vérification invalide ou expiré.',
    ar: 'رابط التحقق غير صالح أو منتهي الصلاحية.',
  },
  {
    pattern: /verification token has expired/i,
    fr: 'Le lien de vérification a expiré. Veuillez en demander un nouveau.',
    ar: 'انتهت صلاحية رابط التحقق. يرجى طلب رابط جديد.',
  },
  {
    pattern: /failed to send verification email/i,
    fr: "Impossible d'envoyer l'email de vérification. Veuillez réessayer.",
    ar: 'تعذر إرسال بريد التحقق. يرجى المحاولة مرة أخرى.',
  },

  // ── Registration / Duplicates ───────────────────────────────────
  {
    pattern: /email already in use/i,
    fr: 'Cet email est déjà utilisé.',
    ar: 'هذا البريد الإلكتروني مستخدم بالفعل.',
  },
  {
    pattern: /unique code already in use/i,
    fr: 'Ce code unique est déjà utilisé.',
    ar: 'هذا الرمز الفريد مستخدم بالفعل.',
  },
  {
    pattern: /user with this email already exists/i,
    fr: 'Un utilisateur avec cet email existe déjà.',
    ar: 'يوجد بالفعل مستخدم بهذا البريد الإلكتروني.',
  },

  // ── Premium tokens ──────────────────────────────────────────────
  {
    pattern: /token premium invalide ou expiré/i,
    fr: 'Token premium invalide ou expiré.',
    ar: 'رمز مميز غير صالح أو منتهي الصلاحية.',
  },
  {
    pattern: /token premium invalide/i,
    fr: 'Token premium invalide.',
    ar: 'رمز مميز غير صالح.',
  },
  {
    pattern: /seuls les élèves peuvent activer/i,
    fr: 'Seuls les élèves peuvent activer un token premium.',
    ar: 'يمكن للطلاب فقط تفعيل الرمز المميز.',
  },

  // ── Rooms / Sessions ────────────────────────────────────────────
  {
    pattern: /room is already live or completed/i,
    fr: 'Cette session est déjà en cours ou terminée.',
    ar: 'هذه الجلسة قيد التنفيذ بالفعل أو اكتملت.',
  },
  {
    pattern: /cannot start room before scheduled time/i,
    fr: "Impossible de démarrer la session avant l'heure prévue.",
    ar: 'لا يمكن بدء الجلسة قبل الموعد المحدد.',
  },
  {
    pattern: /failed to create livekit room/i,
    fr: 'Erreur lors de la création de la salle de visioconférence. Veuillez réessayer.',
    ar: 'خطأ في إنشاء غرفة الفيديو. يرجى المحاولة مرة أخرى.',
  },
  {
    pattern: /room is not live/i,
    fr: "La session n'est pas encore en cours.",
    ar: 'الجلسة ليست قيد التنفيذ بعد.',
  },
  {
    pattern: /cannot join room before scheduled time/i,
    fr: "Impossible de rejoindre la session avant l'heure prévue.",
    ar: 'لا يمكن الانضمام إلى الجلسة قبل الموعد المحدد.',
  },
  {
    pattern: /room is not available/i,
    fr: "La session n'est pas disponible.",
    ar: 'الجلسة غير متاحة.',
  },
  {
    pattern: /you are not assigned to this room/i,
    fr: "Vous n'êtes pas assigné à cette session.",
    ar: 'لم يتم تعيينك لهذه الجلسة.',
  },
  {
    pattern: /you are not invited to this room/i,
    fr: "Vous n'êtes pas invité à cette session.",
    ar: 'لم تتم دعوتك إلى هذه الجلسة.',
  },
  {
    pattern: /you are not the professor of this session/i,
    fr: "Vous n'êtes pas le professeur de cette session.",
    ar: 'أنت لست أستاذ هذه الجلسة.',
  },
  {
    pattern: /room not found/i,
    fr: 'Session introuvable.',
    ar: 'الجلسة غير موجودة.',
  },

  // ── Challenges ──────────────────────────────────────────────────
  {
    pattern: /you can only delete your own challenges/i,
    fr: 'Vous ne pouvez supprimer que vos propres défis.',
    ar: 'يمكنك حذف تحدياتك فقط.',
  },
  {
    pattern: /you can only view attempts on your own challenges/i,
    fr: 'Vous ne pouvez voir que les tentatives sur vos propres défis.',
    ar: 'يمكنك فقط عرض المحاولات على تحدياتك.',
  },
  {
    pattern: /this challenge is no longer active/i,
    fr: "Ce défi n'est plus actif.",
    ar: 'هذا التحدي لم يعد نشطاً.',
  },
  {
    pattern: /you already answered this challenge correctly/i,
    fr: 'Vous avez déjà répondu correctement à ce défi.',
    ar: 'لقد أجبت بالفعل على هذا التحدي بشكل صحيح.',
  },
  {
    pattern: /maximum attempts reached/i,
    fr: 'Nombre maximum de tentatives atteint.',
    ar: 'تم الوصول إلى الحد الأقصى للمحاولات.',
  },
  {
    pattern: /challenge not found/i,
    fr: 'Défi introuvable.',
    ar: 'التحدي غير موجود.',
  },

  // ── Quizzes ─────────────────────────────────────────────────────
  {
    pattern: /cannot publish quiz without questions/i,
    fr: 'Impossible de publier un quiz sans questions.',
    ar: 'لا يمكن نشر اختبار بدون أسئلة.',
  },
  {
    pattern: /quiz is not published/i,
    fr: "Le quiz n'est pas encore publié.",
    ar: 'الاختبار لم يُنشر بعد.',
  },
  {
    pattern: /you have already taken this quiz/i,
    fr: 'Vous avez déjà passé ce quiz.',
    ar: 'لقد أجريت هذا الاختبار بالفعل.',
  },
  {
    pattern: /quiz not found/i,
    fr: 'Quiz introuvable.',
    ar: 'الاختبار غير موجود.',
  },
  {
    pattern: /question not found/i,
    fr: 'Question introuvable.',
    ar: 'السؤال غير موجود.',
  },

  // ── Resources not found ─────────────────────────────────────────
  {
    pattern: /professor.*not found|not found.*professor/i,
    fr: 'Professeur introuvable.',
    ar: 'الأستاذ غير موجود.',
  },
  {
    pattern: /student not found/i,
    fr: 'Élève introuvable.',
    ar: 'التلميذ غير موجود.',
  },
  {
    pattern: /user not found/i,
    fr: 'Utilisateur introuvable.',
    ar: 'المستخدم غير موجود.',
  },
  {
    pattern: /participant not found/i,
    fr: 'Participant introuvable.',
    ar: 'المشارك غير موجود.',
  },
  {
    pattern: /summary not found/i,
    fr: 'Résumé introuvable.',
    ar: 'الملخص غير موجود.',
  },

  // ── Validation errors (Jakarta Bean Validation) ─────────────────
  {
    pattern: /validation failed/i,
    fr: 'Veuillez vérifier les champs du formulaire.',
    ar: 'يرجى التحقق من حقول النموذج.',
  },
  {
    pattern: /name is required/i,
    fr: 'Le nom est requis.',
    ar: 'الاسم مطلوب.',
  },
  {
    pattern: /email is required/i,
    fr: "L'email est requis.",
    ar: 'البريد الإلكتروني مطلوب.',
  },
  {
    pattern: /email should be valid/i,
    fr: "L'adresse email n'est pas valide.",
    ar: 'عنوان البريد الإلكتروني غير صالح.',
  },
  {
    pattern: /password is required/i,
    fr: 'Le mot de passe est requis.',
    ar: 'كلمة المرور مطلوبة.',
  },
  {
    pattern: /password must be at least/i,
    fr: 'Le mot de passe doit contenir au moins 6 caractères.',
    ar: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
  },
  {
    pattern: /username is required/i,
    fr: "Le nom d'utilisateur est requis.",
    ar: 'اسم المستخدم مطلوب.',
  },
  {
    pattern: /uniquecode is required|unique.*code.*required/i,
    fr: 'Le code unique est requis.',
    ar: 'الرمز الفريد مطلوب.',
  },
  {
    pattern: /nickname is required/i,
    fr: 'Le surnom est requis.',
    ar: 'اللقب مطلوب.',
  },
  {
    pattern: /level is required/i,
    fr: 'Le niveau est requis.',
    ar: 'المستوى مطلوب.',
  },
  {
    pattern: /access token is required/i,
    fr: "Le token d'accès est requis.",
    ar: 'رمز الوصول مطلوب.',
  },
  {
    pattern: /role is required/i,
    fr: 'Le rôle est requis.',
    ar: 'الدور مطلوب.',
  },
  {
    pattern: /room name is required/i,
    fr: 'Le nom de la session est requis.',
    ar: 'اسم الجلسة مطلوب.',
  },
  {
    pattern: /language is required/i,
    fr: 'La matière est requise.',
    ar: 'المادة مطلوبة.',
  },
  {
    pattern: /objective is required/i,
    fr: "L'objectif est requis.",
    ar: 'الهدف مطلوب.',
  },
  {
    pattern: /scheduled time is required/i,
    fr: "L'horaire est requis.",
    ar: 'الموعد مطلوب.',
  },
  {
    pattern: /scheduled time must be in the future/i,
    fr: "L'horaire doit être dans le futur.",
    ar: 'يجب أن يكون الموعد في المستقبل.',
  },
  {
    pattern: /duration is required/i,
    fr: 'La durée est requise.',
    ar: 'المدة مطلوبة.',
  },
  {
    pattern: /duration must be at least/i,
    fr: 'La durée doit être de 15 minutes minimum.',
    ar: 'يجب أن تكون المدة 15 دقيقة على الأقل.',
  },
  {
    pattern: /duration cannot exceed/i,
    fr: 'La durée ne peut pas dépasser 8 heures.',
    ar: 'لا يمكن أن تتجاوز المدة 8 ساعات.',
  },
  {
    pattern: /at least one language is required/i,
    fr: 'Au moins une matière est requise.',
    ar: 'مادة واحدة على الأقل مطلوبة.',
  },
  {
    pattern: /specialization is required/i,
    fr: 'La spécialisation est requise.',
    ar: 'التخصص مطلوب.',
  },

  // ── HTTP generic errors ─────────────────────────────────────────
  {
    pattern: /^HTTP 400/i,
    fr: 'Requête invalide. Veuillez vérifier les informations saisies.',
    ar: 'طلب غير صالح. يرجى التحقق من المعلومات المدخلة.',
  },
  {
    pattern: /^HTTP 401/i,
    fr: 'Session expirée. Veuillez vous reconnecter.',
    ar: 'انتهت الجلسة. يرجى إعادة تسجيل الدخول.',
  },
  {
    pattern: /^HTTP 403/i,
    fr: "Accès refusé.",
    ar: 'تم رفض الوصول.',
  },
  {
    pattern: /^HTTP 404/i,
    fr: 'Ressource introuvable.',
    ar: 'المورد غير موجود.',
  },
  {
    pattern: /^HTTP 409/i,
    fr: 'Conflit — cette ressource existe déjà.',
    ar: 'تعارض — هذا المورد موجود بالفعل.',
  },
  {
    pattern: /^HTTP 5\d{2}/i,
    fr: 'Erreur serveur. Veuillez réessayer plus tard.',
    ar: 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
  },
  {
    pattern: /an unexpected error occurred/i,
    fr: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  },
  {
    pattern: /failed to fetch|network|ERR_CONNECTION|ECONNREFUSED|fetch/i,
    fr: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
    ar: 'تعذر الاتصال بالخادم. تحقق من اتصالك.',
  },
];

/**
 * Convert a raw backend error message to a user-friendly localised string.
 * Falls back to a generic message when no mapping matches.
 */
export function getFriendlyErrorMessage(raw: unknown, isRTL: boolean): string {
  const message = typeof raw === 'string' ? raw : raw instanceof Error ? raw.message : String(raw ?? '');

  if (!message) {
    return isRTL ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Une erreur est survenue. Veuillez réessayer.';
  }

  for (const mapping of ERROR_MAPPINGS) {
    if (mapping.pattern.test(message)) {
      return isRTL ? mapping.ar : mapping.fr;
    }
  }

  // If the message is already in French (contains accent characters) or Arabic, pass it through
  if (/[àâéèêëïîôùûüÿçœæ]/i.test(message) || /[\u0600-\u06FF]/.test(message)) {
    return message;
  }

  // Generic fallback
  return isRTL ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Une erreur est survenue. Veuillez réessayer.';
}
