# KashFlow visual direction

Approved by the owner: the light iOS concept and its desktop companion, inspired by Apple Wallet and Health. This replaces the earlier charcoal/emerald proposal.

## Identity and hierarchy

A personal money overview with generous space and native-feeling controls. Available balance is the strongest element. Monthly incoming/outgoing money shares one comparison scale. Recent activity and account balances form the supporting content. Detailed analysis has its own existing page.

Desktop uses a persistent sidebar and two content columns. Mobile stacks balance, period comparison, create action, activity, and accounts. Four primary destinations sit in a bottom dock; the header menu exposes all other destinations. Indonesian labels and IDR formatting match the existing application.

## Visual decisions

- Warm gray canvas and opaque white grouped surfaces distinguish content without decorative borders or glow.
- System typography prioritizes the native Apple appearance on Apple devices; platform and Geist fallbacks support other systems. Tabular numerals help compare money.
- Blue identifies actions and incoming money. Orange identifies outgoing comparison bars. Labels and signs convey meaning independently of color.
- Rounded grouped panels reflect the approved design. Circular icons distinguish transaction and account types, using the existing Lucide library.
- Light is the default for new sessions. Saved theme choices remain respected; dark uses neutral surfaces and brighter blue text.
- Motion is limited to loading feedback, with reduced-motion support. No ornamental entrance animations.

## Content and behavior

All financial values come from the existing API. Preview fixture data is temporary and excluded from delivery. Transfers and reconciliations retain the existing summary calculation rules. Empty periods stay empty rather than displaying unrelated transactions. Failed fetches display explicit error states. Existing creation and reconciliation APIs remain unchanged.

Anti-slop reference: https://github.com/miqdadbadjuber/anti-slop . Applied during implementation as requested; the owner-approved Apple direction is the visual source of truth.
