package com.james.app.exceptions

import groovy.transform.Canonical
import java.time.Instant

@Canonical
class StandardError {
    Instant timestamp
    Integer status
    String error
    String message
    String path
}