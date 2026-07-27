# Changelog

All notable changes to SATQUEST are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Auto-provisioning completo de novos usuários (profile + wallet + friend code) via trigger
- Sistema de amigos com solicitações, aceitação e rejeição
- Sistema de ligas (Bronze → Lenda) baseado em XP semanal
- Tabela de tipos de desafios (`challenge_types`) com 20 categorias
- Tabela de desafios do usuário (`user_challenges`)
- Tabela de congelamento de sequência (`streak_freezes`)
- 35+ badges no banco de dados
- Perfil estendido: username, cidade, país, escola, links sociais, banner colorido
- Código de amizade único gerado automaticamente (formato `SAT-XXXXXX`)
- RPC `update_profile_extended` para editar todos os campos do perfil
- RPCs de amizade: `send_friend_request`, `accept_friend_request`, `reject_friend_request`
- Exportação de dados do usuário em JSON
- Documentação completa: README, arquitetura, API, banco de dados, segurança, etc.
- Templates do GitHub: issues, PRs, discussões, CI/CD, dependabot, codeowners

### Fixed
- **CRÍTICO**: Cadastro de novos usuários agora funciona corretamente
  - Trigger `handle_new_user` reescrito para criar profile + wallet automaticamente
  - Removido upsert manual de profile no frontend (causava race condition com RLS)
  - Tratamento de erro melhorado no `signUp`
- Policy de `profiles` atualizada para SELECT público entre usuários autenticados

### Changed
- `signUp` no frontend não faz mais upsert manual — delega ao trigger do banco
- Perfil agora exibe username, liga, código de amizade, estatísticas extras
- Tela de edição de perfil expandida com todos os novos campos

## [0.3.0] - 2026-07-23

### Added
- Migração para recompensas apenas em XP (sem sats por lições/jogos/missões)
- Carteira real continua funcionando para envio/recebimento manual

## [0.2.0] - 2026-07-22

### Added
- Game Center com jogos, ranking e temporadas
- Open Finance com verificação de idade
- Cartões virtuais (age-gated)
- Colecionáveis e baús
- Módulos educacionais com níveis de dificuldade
- Hardening de segurança V4 (audit logs, rate limits, cooldowns)

## [0.1.0] - 2026-07-21

### Added
- Schema inicial: trilhas, lições, progresso, carteira, missões, badges, convites
- Autenticação email/senha via Supabase Auth
- Trigger `handle_new_user` para criação automática de profile
- RLS em todas as tabelas
- Funções RPC atômicas: `complete_lesson`, `claim_mission`, `record_game_score`
- Frontend React + Vite com telas de Home, Trilhas, Lições, Carteira, Missões, Perfil
