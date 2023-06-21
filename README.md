# plink-nvim-site

This is the backend code for
[plink.nvim](https://github.com/darksinge/plink.nvim), hosted on AWS using
[SST](https://sst.dev).

## Installation

`pnpm install`

## Development

Requires AWS credentials to be configured on your system. Instructions on how
to do this can be found
[here](https://docs.sst.dev/advanced/iam-credentials#loading-credentials).

`pnpm run dev --profile <profile_name>`

## Deploy

`pnpm run deploy --stage prod --profile <profile_name>`

## Test

TODO: Add tests

## Contributing

This project is in its infancy stage. Open an issue if you have an idea you'd
like to contribute and let's talk!
