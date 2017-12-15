# Changelog

## [Version 1.5.1] (15.12.2017 - 03.22 PM)
#### Features
* Added methods to retrieve ``organisation`` and ``user id`` from ``JWT``

## [Version 1.4.0] (13.12.2017 - 04:54 PM)
#### Bugfixes
* Fix bug where ``resetFlow`` value was not set because the one in ``Options`` was not used.

## [Version 1.3.0] (13.12.2017 - 04:41 PM)
#### Bugfixes
* Fix bug where headers did not work after the last update

## [Version 1.2.0] (13.12.2017 - 03:52 PM)
#### Bugfixes
* Add ``resetFlow`` option to ``Options`` interface so the user can override the builtin ``firstLoad`` functionality

## [Version 1.1.0] (28.07.2017 - 10:51 AM)
#### Bugfixes
* Properly handle condition witin the "output" event so the client does not crash when
the CAI-server returns a number

## [Version 1.0.0] (19.07.2017 - 05:13 PM)
#### Bugfixes
* add 'return' statement in front of 'reject' calls within Promises. This fixes a bug where the promise was
rejected but some code got still executed even though it shouldn't

#### Features
* Add a message-buffer to the client. Whenever a message should be send to the CAI-server but the connection
is currently not up, the message will be buffered and send later on
* Replace throwing errors by just logging them to the console
* Add full documentation to all methods using JS-Doc synthax