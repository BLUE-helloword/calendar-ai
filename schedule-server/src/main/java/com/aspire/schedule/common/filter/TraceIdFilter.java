package com.aspire.schedule.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
public class TraceIdFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_KEY = "traceId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put(TRACE_ID_KEY, traceId);
        response.setHeader("X-Trace-Id", traceId);

        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long start = System.currentTimeMillis();
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        String path = query != null ? uri + "?" + query : uri;

        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            int status = responseWrapper.getStatus();
            if (status >= 400) {
                log.warn("{} {} -> {} ({}ms)", method, path, status, elapsed);
            } else {
                log.info("{} {} -> {} ({}ms)", method, path, status, elapsed);
            }
            responseWrapper.copyBodyToResponse();
            MDC.remove(TRACE_ID_KEY);
        }
    }
}
