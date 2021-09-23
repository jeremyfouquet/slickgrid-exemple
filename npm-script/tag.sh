#!/usr/bin/env bash

NEW_VERSION=$1
CURRENT_REPOSITORY=$(pwd)
REMOTE_PUBLISH_ARG="origin"
BRANCH_PUBLISH_ARG="master"

DIR=$(dirname ${0})
source $DIR/version_compare

# UTILITY FUNCTIONS
function fatal {
    (>&2 echo "FATAL ERROR : "$1)
    exit 0
}

function fatalUsage {
    (>&2 echo "FATAL ERROR : "$1)
    echo "USAGE: npm run tag #.#.# (where #.#.# is your new version number)"
    exit 0
}

##
## MAIN FUNCTIONS
##

function checkVersion {
    if [ -d $NEW_VERSION ]; then
        fatalUsage "Missing version number."
    fi

    EXISTING_VERSION=$(git describe --abbrev=0 --tags)
    ! version_compare ${NEW_VERSION} ${EXISTING_VERSION} ">" && fatal "New version number can't be inferior or equal to previous one ($NEW_VERSION < $EXISTING_VERSION)"
}

function checkLocalGitChanges {
    if [ ! -d ".git" ]; then
        fatal "$CURRENT_REPOSITORY is not a git repository"
    fi

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || fatal "Cannot get the current branch")
    if [ "$CURRENT_BRANCH" != "$BRANCH_PUBLISH_ARG" ]; then
        fatal "$CURRENT_BRANCH is not equal to $BRANCH_PUBLISH_ARG on $CURRENT_REPOSITORY. Used -b option to target an other branch"
    fi
    LOCAL_CHANGES=$(git status -suno || fatal "Cannot check the current changes")

    if [ -n "$LOCAL_CHANGES" ]; then
        fatal "You have local changes on $CURRENT_REPOSITORY"
    fi
}

function checkPushPermissions {
    if git push $REMOTE_PUBLISH_ARG $BRANCH_PUBLISH_ARG; then
        echo ""
    else
        fatal "You have no right to create a new version"
    fi
}

function versionApplication {
    cd "$CURRENT_REPOSITORY";
    npm version --no-git-tag-version --tag-version-prefix="" "$NEW_VERSION";
}

function tagAll {
    git commit -am "$NEW_VERSION";
    git tag -am "$NEW_VERSION" "$NEW_VERSION";
    git push $REMOTE_PUBLISH_ARG $BRANCH_PUBLISH_ARG --tags;
}

##
## MAIN CALLS
##

checkVersion
checkLocalGitChanges
checkPushPermissions
versionApplication

# To remove when JIRA will be able to handle publish
tagAll
