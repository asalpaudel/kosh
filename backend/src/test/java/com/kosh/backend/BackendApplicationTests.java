package com.kosh.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

class BackendApplicationTests {

	@Test
	void applicationEntryPointIsSpringBootConfiguration() {
		assertThat(BackendApplication.class.isAnnotationPresent(SpringBootApplication.class)).isTrue();
	}

}
