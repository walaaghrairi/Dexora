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

import java.time.LocalDateTime;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class LearningContentInitializer implements ApplicationRunner {

    private static final String COMMONS_REFERENCE =
            "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sign_language_%s.svg";

    private static final SeedSign[] FIRST_SIGN_SEEDS = {
            new SeedSign("Bonjour", "BONJOUR", "Observe puis reproduis le geste Bonjour."),
            new SeedSign("Salut / Hi", "HI", "Observe puis reproduis le geste Salut."),
            new SeedSign("Thank you", "THANK_YOU", "Observe puis reproduis le geste Thank you."),
            new SeedSign("Je t'aime", "I_LOVE_YOU", "Observe puis reproduis le geste Je t'aime."),
            new SeedSign("Merci", "MERCI", "Observe puis reproduis le geste Merci.")
    };

    private static final Set<String> LEGACY_FIRST_SIGN_LABELS = Set.of(
            "Best of Luck", "You", "I/Me", "Like", "Remember", "Love", "I love you"
    );

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final SignRepository signRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Category greetings = categoryRepository.findByName("Salutations")
                .orElseGet(() -> createCategory(
                        "Salutations",
                        "Des expressions simples reconnues par le modèle étendu."
                ));
        greetings.setDescription("Des expressions simples reconnues par le modèle étendu.");
        categoryRepository.save(greetings);

        Course firstSignsCourse = courseRepository.findFirstByTitle("Premiers signes")
                .orElseGet(() -> createCourse(
                        "Premiers signes",
                        "5 expressions vidéo guidées pour commencer à communiquer.",
                        greetings
                ));
        firstSignsCourse.setDescription("5 expressions vidéo guidées pour commencer à communiquer.");
        firstSignsCourse.setCategory(greetings);
        firstSignsCourse = courseRepository.save(firstSignsCourse);

        for (SeedSign seed : FIRST_SIGN_SEEDS) {
            upsertSign(seed.word(), seed.modelLabel(), seed.description(), null, firstSignsCourse);
        }
        signRepository.findAllByCourseId(firstSignsCourse.getId()).stream()
                .filter(sign -> LEGACY_FIRST_SIGN_LABELS.contains(sign.getModelLabel()))
                .forEach(signRepository::delete);

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
            upsertSign(
                    "Lettre " + label,
                    label,
                    "Observe la forme de la main, puis reproduis la lettre " + label + ".",
                    COMMONS_REFERENCE.formatted(label),
                    alphabetCourse
            );
        }

        Category numbers = categoryRepository.findByName("Chiffres")
                .orElseGet(() -> createCategory(
                        "Chiffres",
                        "Le parcours des chiffres sera activé avec le prochain modèle de reconnaissance."
                ));
        numbers.setDescription("Apprendre les chiffres ASL de 0 à 9 avec reconnaissance IA.");
        categoryRepository.save(numbers);

        Course numbersCourse = courseRepository.findFirstByTitle("Chiffres ASL")
                .orElseGet(() -> createCourse(
                        "Chiffres ASL",
                        "10 leçons guidées pour maîtriser les chiffres de 0 à 9.",
                        numbers
                ));
        numbersCourse.setDescription("10 leçons guidées pour maîtriser les chiffres de 0 à 9.");
        numbersCourse.setCategory(numbers);
        numbersCourse = courseRepository.save(numbersCourse);

        for (int value = 0; value <= 9; value++) {
            String label = String.valueOf(value);
            upsertSign(
                    "Chiffre " + label,
                    label,
                    "Observe la position des doigts, puis reproduis le chiffre " + label + ".",
                    null,
                    numbersCourse
            );
        }
    }

    private void upsertSign(
            String word,
            String modelLabel,
            String description,
            String imageUrl,
            Course course
    ) {
        Sign sign = signRepository.findByModelLabelIgnoreCase(modelLabel).orElseGet(Sign::new);
        sign.setWord(word);
        sign.setDescription(description);
        sign.setImageUrl(imageUrl);
        sign.setDifficulty(Difficulty.BEGINNER);
        sign.setModelLabel(modelLabel);
        if (sign.getCreatedAt() == null) {
            sign.setCreatedAt(LocalDateTime.now());
        }
        sign.setCourse(course);
        signRepository.save(sign);
    }

    private Category createCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setCreatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    private Course createCourse(String title, String description, Category category) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setCategory(category);
        course.setCreatedAt(LocalDateTime.now());
        return courseRepository.save(course);
    }

    private record SeedSign(String word, String modelLabel, String description) {
    }
}
