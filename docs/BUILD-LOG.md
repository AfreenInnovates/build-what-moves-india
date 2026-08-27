# Seven Gates build log

This is a short record of how the current proof of concept was assembled.

## What Codex helped with

OpenAI Codex (GPT-5.6 Luna and GPT-5.6 Terra, medium reasoning effort) helped with the i18n extraction and JSX-wrapping scripts, the translation pass, documentation, the MIT licence, the transparency-page scaffolding, UI refinement, responsive checks, and generated visual assets. Those changes are visible in the `Codex:`-prefixed commits and in the files themselves.

## What stayed deliberately human-owned

The gate specification, its dependency relationships, the predicates, the resolver, and the critical-path calculation were written and kept as explicit product and engineering decisions. They are data-driven, pure, and unit-tested so a model cannot quietly invent a result. The product direction, wording, visual hierarchy, and final design choices were decided by Afreen Hossain, with Codex used as an implementation and review partner.

## One correction the model needed

An early OCR probe produced a plausible-looking Kannada reading that was wrong. It was caught during review and the project kept the limitation visible instead of presenting the output as reliable. That is why the transparency page labels the translations as estimated and why no OCR result is used to decide a gate.

The build is a proof of concept, but its boundaries are intentional: real persistence, deterministic rules, synthetic fixtures, server-side secrets, and explicit seams for future integrations.
