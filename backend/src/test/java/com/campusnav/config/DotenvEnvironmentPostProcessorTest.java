package com.campusnav.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DotenvEnvironmentPostProcessorTest {

    @Test
    void parsesAndUnquotesDotenvValues() {
        assertThat(DotenvEnvironmentPostProcessor.parse("JWT_SECRET=\"a-secret\""))
                .hasValueSatisfying(entry -> {
                    assertThat(entry.getKey()).isEqualTo("JWT_SECRET");
                    assertThat(entry.getValue()).isEqualTo("a-secret");
                });
    }

    @Test
    void ignoresCommentsAndMalformedLines() {
        assertThat(DotenvEnvironmentPostProcessor.parse("# database settings")).isEmpty();
        assertThat(DotenvEnvironmentPostProcessor.parse("not-an-entry")).isEmpty();
    }
}
