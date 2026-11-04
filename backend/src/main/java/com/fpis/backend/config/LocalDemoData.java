package com.fpis.backend.config;

import com.fpis.backend.domain.*;
import com.fpis.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDate;

@Configuration
@Profile({"local", "demo"})
public class LocalDemoData {
    @Bean
    CommandLineRunner seedDemoData(DepartmentRepository departments, FacultyRepository faculty, ContributionRepository contributions,
                                   WorkloadRepository workloads, PasswordEncoder encoder) {
        return args -> {
            if (departments.count() == 0) {
                Department computing = departments.save(new Department("Computer Science", "CSE"));
                Department sciences = departments.save(new Department("Applied Sciences", "SCI"));
                faculty.save(new Faculty("Dr Goldy Sharma", "admin@fpis.edu", encoder.encode("Admin@123"), com.fpis.backend.domain.Role.ADMIN, computing));
                faculty.save(new Faculty("Dr Jaspreet Singh", "hod@fpis.local", encoder.encode("HodDemo!2026"), com.fpis.backend.domain.Role.HOD, computing));
                Faculty professor = faculty.save(new Faculty("Dr Amrit Tomar", "faculty@fpis.local", encoder.encode("FacultyDemo!2026"), com.fpis.backend.domain.Role.FACULTY, computing));
                faculty.save(new Faculty("Demo Dean", "dean@fpis.local", encoder.encode("DeanDemo!2026"), com.fpis.backend.domain.Role.DEAN, sciences));
                contributions.save(new Contribution(professor, "TEACHING", "Curriculum redesign", "Updated core course materials", 20, LocalDate.now().minusMonths(2)));
                contributions.save(new Contribution(professor, "RESEARCH", "Conference publication", "Peer-reviewed publication", 32, LocalDate.now().minusMonths(1)));
                workloads.save(new Workload(professor, "2026-27", "Fall", 12, 8, 4));
            }

            faculty.findByEmailIgnoreCase("admin@fpis.edu").ifPresent(member -> {
                String designation = "Faculty Administrator".equals(member.getJobTitle()) ? null : member.getJobTitle();
                member.updateIdentity("Dr Goldy Sharma", designation);
                faculty.save(member);
            });
            faculty.findByEmailIgnoreCase("faculty@fpis.local").ifPresent(member -> {
                String designation = "Faculty Member".equals(member.getJobTitle()) ? null : member.getJobTitle();
                member.updateIdentity("Dr Amrit Tomar", designation);
                faculty.save(member);
            });
            faculty.findByEmailIgnoreCase("hod@fpis.local").ifPresent(member -> {
                if ("Demo Department Head".equals(member.getFullName())) {
                    member.updateIdentity("Dr Jaspreet Singh", member.getJobTitle());
                    faculty.save(member);
                }
            });
        };
    }
}
