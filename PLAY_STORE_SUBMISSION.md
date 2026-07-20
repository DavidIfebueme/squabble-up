# Play Store Submission

## App Details

- **App Name:** Squabble Up
- **Package Name:** app.squabbleup.mobile
- **Category:** Social
- **Rating:** 12+ (mild language, user-generated debates)

## Store Listing

### Title
Squabble Up — Voice Debates

### Short Description
Argue your case. Voice debate anything with AI-powered scoring.

### Full Description
Squabble Up is the first voice debate platform where you can argue any topic, get scored by AI, and prove your point. No typing — just speak your case.

**HOW IT WORKS**
1. Pick a topic — from politics to pop culture
2. Choose your side — FOR or AGAINST
3. Record your opening (90s), rebuttal (90s), and closing (60s)
4. Get scored by AI on logic, evidence, persuasiveness, and delivery

**FEATURES**
- Voice-only debates — no typing required
- AI scoring powered by Gemini 2.0 Flash
- On-device speech recognition (no audio upload)
- Community voting on completed debates
- Shareable score cards
- Guest mode — debate without an account
- ELO ratings and debate history
- Real-time opponent status

### Screenshots
- Home screen with topic feed
- Debate lobby waiting for opponent
- Recording screen with ON AIR indicator
- Verdict screen with AI scores
- Score card shareable image

### Google Play Graphics
- Feature graphic: 1024x500
- Icon: 512x512

## Build Instructions

### Prerequisites
- Node.js 22+
- pnpm
- Expo CLI
- EAS CLI

### Build AAB
```bash
pnpm install
cd apps/mobile
eas build --platform android --profile production
```

### Build APK (for testing)
```bash
eas build --platform android --profile preview
```

## Content Rating
- **Mature Content:** User-generated debates may contain mature topics
- **Language:** Users may use strong language in debates (filtered by moderation)
- **Rating:** Recommended for ages 12+

## Privacy Policy
Debate recordings are transcribed on-device. No audio files are uploaded or stored.
User data (profiles, debate history, ELO scores) is stored securely.
Email is used only for authentication. No data is shared with third parties.

## Terms of Service
- Users must be 13+ to create an account
- Guest sessions expire after 24 hours
- Hate speech, threats, and harassment are prohibited
- Debates violating guidelines are flagged and removed
- Users can report content for moderation review
