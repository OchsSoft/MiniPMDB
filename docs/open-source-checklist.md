# First public release checklist

## Repository

- [ ] Confirm `OchsSoft` is the intended copyright holder.
- [ ] Run `npm run sanitize` from a clean checkout.
- [ ] Review every tracked file and the full Git history for private paths, names, data, and credentials.
- [ ] Confirm the repository description and topics emphasize agent-memory governance, not generic recall.
- [ ] Enable secret scanning and private vulnerability reporting.
- [ ] Add a main-branch ruleset after the initial commit; require the validation workflow and pull requests.
- [ ] Keep auto-merge disabled.

## Release

- [ ] Enter the primary `/feedback` Session ID directly in the required Devpost field; do not add a placeholder to the repository or video.
- [ ] Confirm the public commit range contains only work eligible for judging.
- [ ] Tag `v0.1.0` only after CI passes from the public repository.
- [ ] Test the README judge path in a fresh public clone with an empty MiniPMDB runtime and binary cache.
- [ ] Verify the composite action against a separate synthetic repository.
- [ ] Publish release notes with known limitations, MongoDB 8.2.6, and snapshot schema v2.

## Submission

- [ ] Developer Tools is the selected category.
- [ ] Repository and video URLs work while signed out.
- [ ] Video is under three minutes, contains narration, and shows the product working.
- [ ] Project description clearly discloses the preexisting private foundation and identifies the new judged work.
- [ ] Setup, sample data, tests, and judge path are present.
- [ ] Final submission is complete before the event deadline; do not depend on last-minute uploads.
