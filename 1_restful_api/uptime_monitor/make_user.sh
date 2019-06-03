#!/usr/bin/env bash
set -e

data='{"firstName":"'
data+="$(passgen -a 10)"
data+='","lastName":"'
data+="$(passgen -a 10)"
data+='","phone":"'
data+="$(passgen -n 10)"
data+='","password":"password","tosAgreement":true}'

echo $data
