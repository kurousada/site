#!/bin/bash

echo -e "\033[0;32mDeploying updates to GitHub...\033[0m"

# Build the project.
hugo # if using a theme, replace by `hugo -t <yourtheme>`

# Copy google API key
cp ./google5d05a86c2df54ae3.html ./docs/google5d05a86c2df54ae3.html

# Copy fonts
cp -R ./fonts ./docs/fonts

# Go To Public folder
cd docs
# Add changes to git.
git add -A

# Commit changes.
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"

# Push source and build repos.
git push origin master

# Come Back
cd ..