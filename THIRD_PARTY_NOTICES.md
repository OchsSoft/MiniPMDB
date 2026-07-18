# Third-party notices

MiniPMDB uses the following runtime packages. Their complete license texts are installed with each package and distributed by npm.

- `mongodb` 7.5.0 — the official MongoDB Node.js driver, Apache License 2.0.
- `mongodb-memory-server-core` 11.2.0 — managed local MongoDB runtime helper, MIT License.

Managed mode downloads an unmodified MongoDB Community Server 8.2.6 binary on first use. The binary is not included in this repository or npm package. MongoDB Community Server is distributed by MongoDB, Inc. under the Server Side Public License; see the [MongoDB licensing page](https://www.mongodb.com/legal/licensing/community-edition) and the license shipped with the downloaded software.

The optional `compose.yaml` uses the Docker Official Image `mongo:8.2.6-noble`. Container tooling and that image are not bundled with MiniPMDB.
