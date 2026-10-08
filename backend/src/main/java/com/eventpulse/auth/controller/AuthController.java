package com.eventpulse.auth.controller;

import com.eventpulse.auth.dto.AuthRequest;
import com.eventpulse.auth.dto.AuthResponse;
import com.eventpulse.auth.dto.RegisterRequest;
import com.eventpulse.auth.service.AuthService;
import com.eventpulse.common.dto.ApiResponse;
import com.eventpulse.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User registered successfully", response));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (ResponseStatusException e) {
            HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
            if (status == null) {
                status = HttpStatus.TOO_MANY_REQUESTS;
            }
            return ResponseEntity.status(status).body(ApiResponse.error(e.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (ResponseStatusException e) {
            HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
            if (status == null) {
                status = HttpStatus.TOO_MANY_REQUESTS;
            }
            return ResponseEntity.status(status).body(ApiResponse.error(e.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthenticated"));
        }
        AuthResponse response = authService.getMe(user);
        return ResponseEntity.ok(ApiResponse.success("User profile fetched", response));
    }

    /**
     * Stateless Bearer logout: the server holds no session, so there is
     * nothing to revoke. Clients MUST discard the token (and user session).
     * This endpoint exists so clients have an explicit logout call that can
     * be extended later with refresh-token revocation.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully. Discard the token on the client.", null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimit(ResponseStatusException e) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.TOO_MANY_REQUESTS;
        }
        return ResponseEntity.status(status).body(ApiResponse.error(e.getReason()));
    }
}
