package com.dexora.config;

import com.dexora.entity.Category;
import com.dexora.entity.Course;
import com.dexora.entity.Sign;
import com.dexora.enums.Difficulty;
import com.dexora.repository.CategoryRepository;
import com.dexora.repository.CourseRepository;
import com.dexora.repository.SignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class LearningContentInitializer implements ApplicationRunner {

    private static final String COMMONS_REFERENCE =
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sign_language_%s.svg";

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final SignRepository signRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Category alphabet = categoryRepository.findByName("Alphabet ASL")
                .orElseGet(() -> createCategory(
                        "Alphabet ASL",
                        "Apprendre les 26 lettres, observer chaque geste puis le reproduire devant la caméra."
                ));
        Course alphabetCourse = courseRepository.findFirstByTitle("Alphabet A–Z")
                .orElseGet(() -> createCourse(
                        "Alphabet A–Z",
                        "26 leçons guidées avec reconnaissance IA et mini-tests.",
                        alphabet
                ));

        for (char letter = 'A'; letter <= 'Z'; letter++) {
            String label = String.valueOf(letter);
            Sign sign = signRepository.findByModelLabel(label).orElseGet(Sign::new);
            if (sign.getId() == null) {
                sign.setWord("Lettre " + label);
                sign.setDescription("Observe la forme de la main, puis reproduis la lettre " + label + ".");
                sign.setImageUrl(COMMONS_REFERENCE.formatted(label));
                sign.setDifficulty(Difficulty.BEGINNER);
                sign.setModelLabel(label);
            }
            sign.setCourse(alphabetCourse);
            signRepository.save(sign);
        }

        Category numbers = categoryRepository.findByName("Chiffres")
                .orElseGet(() -> createCategory(
                        "Chiffres",
                        "Le parcours des chiffres sera activé avec le prochain modèle de reconnaissance."
                ));
        courseRepository.findFirstByTitle("Chiffres ASL")
                .orElseGet(() -> createCourse(
                        "Chiffres ASL",
                        "Bientôt disponible : ce modèle reconnaît actuellement uniquement les lettres A à Z.",
                        numbers
                ));
    }

    private Category createCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    private Course createCourse(String title, String description, Category category) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setCategory(category);
        return courseRepository.save(course);
    }
}
