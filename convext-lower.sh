#!/bin/bash

cd $1

for fname in *.JPG; do
  mv $fname ${fname%.JPG}.jpg
done

