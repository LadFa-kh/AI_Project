package com.example.backend.handle;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private int status;       // เช่น 200, 400, 401
    private String message;
    private T data;
}
