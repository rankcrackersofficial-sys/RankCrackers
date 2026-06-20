import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class McqOptionTile extends StatelessWidget {

  final String option;

  final bool selected;

  final bool correct;

  final VoidCallback onTap;

  const McqOptionTile({

    super.key,

    required this.option,

    required this.selected,

    required this.correct,

    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {

    Color borderColor =
        Colors.white12;

    Color bgColor =
    Colors.white.withValues(
      alpha: 0.03,
    );

    if (selected) {

      if (correct) {

        borderColor =
            Colors.green;

        bgColor =
            Colors.green.withValues(
              alpha: 0.10,
            );
      }

      else {

        borderColor =
            Colors.red;

        bgColor =
            Colors.red.withValues(
              alpha: 0.10,
            );
      }
    }

    return GestureDetector(

      onTap: onTap,

      child: AnimatedContainer(

        duration:
        const Duration(
          milliseconds: 240,
        ),

        margin:
        const EdgeInsets.only(
          bottom: 14,
        ),

        padding:
        const EdgeInsets.all(
          16,
        ),

        decoration:
        BoxDecoration(

          color: bgColor,

          borderRadius:
          BorderRadius.circular(
            18,
          ),

          border: Border.all(
            color: borderColor,
          ),
        ),

        child: Row(

          children: [

            Expanded(

              child: Text(

                option,

                style:
                GoogleFonts.poppins(

                  color: Colors.white,

                  fontSize: 13,
                ),
              ),
            ),

            if (selected)

              Icon(

                correct
                    ? Icons.check_circle
                    : Icons.cancel,

                size: 20,

                color:
                correct
                    ? Colors.green
                    : Colors.red,
              ),
          ],
        ),
      ),
    );
  }
}