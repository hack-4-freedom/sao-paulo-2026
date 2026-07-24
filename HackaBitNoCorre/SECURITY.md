# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within SATQUEST, please report it
responsibly. **Do NOT open a public GitHub issue.**

Instead, email **contato@satquest.app** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

You will receive a response within 48 hours. If the vulnerability is confirmed,
we will publish a fix and credit you (unless you prefer to remain anonymous).

## Security Measures

SATQUEST implements defense-in-depth security:

- **Row Level Security (RLS)** on every table — no client can read or write
  another user's data
- **SECURITY DEFINER** functions with `search_path = public, pg_temp` for all
  sensitive operations (wallet credits, lesson completion, account deletion)
- **EXECUTE permissions** restricted to `authenticated` role only
- **Anon role** has zero table privileges (revoked in migration 0007)
- **Audit logging** on all financial and account operations
- **Rate limiting**: max 10 referral codes/day, max 20 game scores/day
- **Cooldown**: 60s between game scores
- **Age verification** on backend for Open Finance and virtual cards
- **Wallet balance** updates only via RPC — no direct client UPDATE
- **Immutable financial tables**: `wallet_txs`, `xp_events`, `game_scores`
  have no UPDATE or DELETE policies

## Disclosure Timeline

- **Day 0**: Report received and acknowledged
- **Day 1-7**: Vulnerability verified, fix developed
- **Day 7-14**: Fix deployed, advisory published
- **Day 30**: Public disclosure (if not yet fixed by reporter request)
