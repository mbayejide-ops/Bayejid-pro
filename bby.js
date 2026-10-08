1
  ];

const text =
  latest?.content?.trim() ||
  "";
তারপর directAction(text) করার আগে এই helper যোগ করো:
function isPossibleRepoName(
  text: string
) {
  return /^[a-zA-Z0-9_.-]+$/.test(
    text.trim()
  );
}

function findPreviousFileRequest(
  messages: ChatInputMessage[]
) {
  const reversed =
    [...messages]
      .reverse();

  for (
    const message of reversed
  ) {
    if (
      message.role !== "user" ||
      !message.content
    ) {
      continue;
    }

    const content =
      message.content.trim();

    const repoPath =
      extractRepoAndPath(
        content
      );

    if (repoPath) {
      return repoPath;
    }

    const file =
      extractFileName(content);

    if (file) {
      return {
        repo: null,
        path: file
      };
    }
  }

  return null;
}
3. runGitHubAgent()-এর direct-action অংশটা বদলাও
বর্তমানে:
const direct =
  await directAction(text);

if (
  direct.handled
) {
  return {
    message:
      direct.message ||
      "Done.",
    refreshRepos:
      Boolean(
        direct.refreshRepos
      )
  };
}
এর আগে এই logic বসাও:
/*
 * -------------------------------------------------------
 * MULTI-TURN FILE REQUEST
 * -------------------------------------------------------
 *
 * Example:
 *
 * User:
 * Github theke Bayejid-pro repo theke bby.js pathao
 *
 * Or:
 *
 * User: Bayejid-pro
 * User: bby.js
 *
 * The agent keeps the previous file intent.
 */

let effectiveText =
  text;

const previousRequest =
  findPreviousFileRequest(
    messages.slice(
      0,
      -1
    )
  );

/*
 * If the latest message is only a repository name
 * and the previous conversation contained a file
 * request, combine them.
 */

if (
  isPossibleRepoName(text) &&
  previousRequest?.path
) {
  effectiveText =
    `${text} repo theke ${previousRequest.path} dao`;
}

/*
 * If the latest message is only an owner name,
 * use the previous repository/file request.
 *
 * Owner is actually auto-detected, so we don't
 * need to ask the user for it.
 */

if (
  isPossibleRepoName(text) &&
  previousRequest?.repo
) {
  effectiveText =
    `${previousRequest.repo} repo theke ${previousRequest.path} dao`;
}

const direct =
  await directAction(
    effectiveText
  );

if (
  direct.handled
) {
  return {
    message:
      direct.message ||
      "Done.",
    refreshRepos:
      Boolean(
        direct.refreshRepos
      )
  };
}