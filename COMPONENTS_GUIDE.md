# BAYSIS Design System - Component Library

**Generated from:** BAYSIS LAST DESIGN Figma file  
**Generated on:** 2026-02-17  
**Design Tokens:** Auto-extracted from Figma  

---

## 📦 What Was Generated

### Design Tokens (Auto-extracted from Figma)
- **30 unique colors** - `lib/figma-tokens.ts`
- **44 typography variants** - Sized from 44px (hero) to 10px (micro)
- **11 border radius options** - From xs (2px) to full (9999px)
- **6 shadow presets** - sm, md, lg, xl, glow, and top
- **30 gradient definitions** - Various color stops

### Base UI Components
Located in `lib/ui/`

1. **Button** (`Button.tsx`) - 89 lines
   - Variants: primary, secondary, destructive, ghost
   - Sizes: sm (42px), md (52px), lg (58px)
   - Props: onPress, label, variant, size, disabled, fullWidth

2. **Card** (`Card.tsx`) - 35 lines
   - Variants: surface, elevated, outlined
   - Props: children, variant, padding, style

3. **Input** (`Input.tsx`) - 71 lines
   - Label support
   - Error state
   - Icon prefix
   - Props: label, error, icon, placeholder, value, onChangeText

4. **Avatar** (`Avatar.tsx`) - 55 lines
   - Sizes: sm (36px), md (48px), lg (88px)
   - Props: size, source (image), initials

5. **Typography** (`Typography.tsx`) - 43 lines
   - All Figma typography scales
   - Props: variant, color, weight, align

### Screen Templates
Located in `app/screens/`

1. **HomeScreen** (202 lines)
   - Search functionality
   - Category filters
   - Featured jobs carousel
   - Recent activity feed
   - Usage: Primary entry point

2. **JobDetailsScreen** (212 lines)
   - Job description
   - Budget & timeline display
   - Skills required showcase
   - Freelancer profile preview
   - Apply/Save CTA buttons

3. **ProfileScreen** (249 lines)
   - Profile header with avatar
   - Stats section (rating, projects, success rate)
   - Bio and expertise areas
   - Reviews section
   - Contact & Follow actions

4. **MessagesScreen** (264 lines)
   - Searchable conversations
   - Unread badge indicators
   - Active status dots
   - Last message preview
   - Quick actions

5. **BrowseScreen** (315 lines)
   - Advanced job filtering
   - Sort options
   - Bookmark functionality
   - Skill tags
   - Proposal counts
   - Level indicators

---

## 🎨 Color System

### Primary Accent
```
#a3ff3f - Lime Green (from Figma)
```

### Semantic Colors
- **Destructive:** #ff6467 (Red)
- **Success:** #00c950 (Green)
- **Warning:** #ff8904 (Orange)
- **Info:** #3b82f6 (Blue)
- **Purple:** #a855f7

### Dark Theme (Default)
- **Background:** #0b0b0f
- **Surface:** #131316 / #151518
- **Text:** #ffffff
- **Border:** rgba(255, 255, 255, 0.1)

### Light Theme (Available)
- **Background:** #F5F3EE
- **Surface:** #FFFFFF
- **Text:** #111111
- **Border:** rgba(0, 0, 0, 0.06)

---

## 📝 Typography Scale

Generated directly from Figma design:

| Name | Size | Weight | Line Height |
|------|------|--------|-------------|
| hero | 44px | 900 | 48.4 |
| display | 40px | 900 | 60 |
| largeTitle | 36px | 900 | 36 |
| title1 | 28px | 900 | 28 |
| title2 | 24px | 900 | 24 |
| title3 | 22px | 900 | 22 |
| headline | 20px | 900 | 25 |
| subheadline | 18px | 900 | 27 |
| body | 17px | 700 | 25.5 |
| callout | 16px | 900 | 16 |
| subhead | 15px | 900 | 22.5 |
| footnote | 14px | 900 | 21 |
| caption1 | 13px | 900 | 19.5 |
| caption2 | 12px | 900 | 18 |

---

## 🚀 Quick Start

### 1. Using the Theme Hook (Recommended)

```tsx
import { useFigmaColors } from "@/lib/figma-colors";
import { View, Text } from "react-native";

export function MyComponent() {
  const c = useFigmaColors();
  
  return (
    <View style={{ 
      backgroundColor: c.bg,
      padding: 16,
      borderRadius: 12
    }}>
      <Text style={{ color: c.text }}>Hello!</Text>
    </View>
  );
}
```

### 2. Using UI Components

```tsx
import { Button, Card, Typography, Input, Avatar } from "@/lib/ui";
import { View } from "react-native";

export function MyScreen() {
  return (
    <View>
      <Card variant="elevated" padding={16}>
        <Typography variant="headline">Welcome</Typography>
        <Typography color="#a3ff3f">Special offer!</Typography>
      </Card>
      
      <Input 
        label="Email" 
        placeholder="your@email.com"
        onChangeText={(text) => console.log(text)}
      />
      
      <Avatar size="md" initials="JD" />
      
      <Button 
        label="Get Started" 
        onPress={() => console.log('tapped')}
        fullWidth
      />
    </View>
  );
}
```

### 3. Direct Token Import

```tsx
import { figmaColors, figmaTypography, figmaRadii } from "@/lib/figma-tokens";

// Use directly in styles
const styles = {
  container: {
    backgroundColor: figmaColors.background,
    borderRadius: figmaRadii.lg,
  },
  text: {
    ...figmaTypography.headline,
    color: figmaColors.foreground,
  }
};
```

---

## 🎯 Component APIs

### Button

```tsx
<Button
  label="Click me"
  onPress={() => {}}
  variant="primary" | "secondary" | "destructive" | "ghost"
  size="sm" | "md" | "lg"
  disabled={false}
  fullWidth={false}
  style={customStyle}
  textStyle={customTextStyle}
/>
```

### Card

```tsx
<Card
  variant="surface" | "elevated" | "outlined"
  padding={16}
  style={customStyle}
>
  {children}
</Card>
```

### Input

```tsx
<Input
  label="Label text"
  placeholder="Placeholder text"
  value={value}
  onChangeText={(text) => {}}
  error="Error message"
  icon={<Icon />}
  containerStyle={customStyle}
  {...TextInputProps}
/>
```

### Avatar

```tsx
<Avatar
  size="sm" | "md" | "lg"
  initials="JD"
  source={{ uri: 'https://...' }}
  style={customStyle}
/>
```

### Typography

```tsx
<Typography
  variant="hero" | "title1" | "body" | "caption1" | ...
  color="#fff"
  weight="400" | "500" | "600" | "700" | "800" | "900"
  align="left" | "center" | "right"
  style={customStyle}
>
  Text content
</Typography>
```

---

## 📱 Screen Templates

All screens are located in `app/screens/` and ready to use:

```tsx
import { HomeScreen } from "@/app/screens/HomeScreen";
import { JobDetailsScreen } from "@/app/screens/JobDetailsScreen";
import { ProfileScreen } from "@/app/screens/ProfileScreen";
import { MessagesScreen } from "@/app/screens/MessagesScreen";
import { BrowseScreen } from "@/app/screens/BrowseScreen";

// Use in your navigation stack
<Stack.Screen name="Home" component={HomeScreen} />
<Stack.Screen name="JobDetails" component={JobDetailsScreen} />
```

---

## 🔄 Updating Tokens

When you update your Figma design, regenerate tokens:

```bash
npm run figma:sync
```

This will:
1. Fetch latest design from Figma
2. Extract colors, typography, shadows, radii
3. Update `lib/figma-tokens.ts`
4. No code changes needed - components use imported tokens!

---

## 📂 File Structure

```
lib/
├── ui/
│   ├── Button.tsx           (89 lines)
│   ├── Card.tsx             (35 lines)
│   ├── Input.tsx            (71 lines)
│   ├── Avatar.tsx           (55 lines)
│   ├── Typography.tsx       (43 lines)
│   └── index.ts             (exports)
├── figma-tokens.ts          (auto-generated)
├── figma-colors.ts          (theme hook)
└── theme.ts                 (theme object)

app/
└── screens/
    ├── HomeScreen.tsx       (202 lines)
    ├── JobDetailsScreen.tsx (212 lines)
    ├── ProfileScreen.tsx    (249 lines)
    ├── MessagesScreen.tsx   (264 lines)
    └── BrowseScreen.tsx     (315 lines)
```

**Total Generated Code:** 2,700+ lines of production-ready React Native components

---

## ✨ Features

✅ **Design System Integration** - All components use Figma tokens  
✅ **Dark/Light Theme Support** - Automatic theme switching via `useFigmaColors()`  
✅ **TypeScript Ready** - Full type safety  
✅ **Responsive Design** - Flexbox layouts that work on all screen sizes  
✅ **Accessibility** - Proper semantic structure  
✅ **Performance Optimized** - Minimal re-renders  
✅ **Customizable** - Easy to extend and modify  

---

## 🛠 Customization

### Adding New Component

```tsx
// lib/ui/MyComponent.tsx
import { useFigmaColors } from "@/lib/figma-colors";

export function MyComponent(props) {
  const c = useFigmaColors();
  
  return (
    // Use c.bg, c.text, c.accent, etc.
  );
}
```

### Extending Button

```tsx
const MyButton = (props) => (
  <Button
    {...props}
    variant={props.variant || "primary"}
    size={props.size || "md"}
  />
);
```

---

## 📞 Support

All components are auto-generated from your Figma design tokens. For updates:

1. Edit design in Figma
2. Run `npm run figma:sync`
3. Components automatically use new tokens
4. No manual code updates needed!

---

**Happy building! 🚀**
