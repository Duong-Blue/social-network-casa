package com.example.manager.dto.responses.common;

import lombok.Data;

@Data
public class ErrorResponse {
    private int status;
    private String message;
    private String errors;

    public ErrorResponse(int status, String message, String errors) {
        this.status = status;
        this.message = message;
        this.errors = errors;
    }

}
